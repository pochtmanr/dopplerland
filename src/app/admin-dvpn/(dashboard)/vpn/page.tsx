import { redirect } from "next/navigation";

export default function VpnRedirectPage() {
  redirect("/admin-dvpn/vpn-servers");
}
