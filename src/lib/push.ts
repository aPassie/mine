import webpush from "web-push";
import { supabase } from "./supabase";

let _configured = false;
function configure() {
  if (_configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_CONTACT;
  if (!pub || !priv || !contact) throw new Error("VAPID not configured");
  webpush.setVapidDetails(contact, pub, priv);
  _configured = true;
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  entryId?: string;
};

type SubRow = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPushToAll(payload: PushPayload): Promise<{
  sent: number;
  failed: number;
}> {
  configure();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (error || !data) return { sent: 0, failed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    (data as SubRow[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body,
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const e = err as { statusCode?: number };
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    }),
  );

  return { sent, failed };
}
