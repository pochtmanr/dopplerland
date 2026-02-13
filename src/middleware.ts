import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(en|he|ru|es|pt|fr|zh|de|fa|ar|hi|id|tr|vi|th|ms|ko|ja|tl|ur|sw)/:path*",
  ],
};
