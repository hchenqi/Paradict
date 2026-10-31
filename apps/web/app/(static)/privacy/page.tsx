import { legalInfo } from "@/lib/legal-info";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <article>
      <h1>Privacy Policy</h1>

      <h2>Data controller</h2>
      <p>
        The data controller is {legalInfo.name || "[Set LEGAL_INFO_NAME]"}.
      </p>

      <h2>Information we process</h2>
      <ul>
        <li>
          <strong>Account information:</strong> Your email address, username,
          optional display name, and authentication information are used to
          create and manage your account and sign you in. Supabase provides
          account authentication.
        </li>
        <li>
          <strong>Dictionary proposals:</strong> We process the entries or
          changes you submit, the proposal's review status and timestamps, and
          its account association so proposals can be reviewed and managed.
          Signed-in members and reviewers can view proposals. Approved
          dictionary entries are public. Do not submit personal or
          confidential information in a proposal.
        </li>
        <li>
          <strong>Technical information:</strong> Our hosting and database
          providers may process information such as your IP address, request
          time, and requested URL in service logs to deliver, secure, and
          troubleshoot the website.
        </li>
      </ul>

      <h2>How information is used and stored</h2>
      <p>
        We use information to operate accounts, maintain and secure the
        website, and review dictionary proposals. Vercel provides hosting and
        delivery; Supabase provides authentication and database services. The
        Supabase project is hosted
        {legalInfo.supabaseRegion ? ` in ${legalInfo.supabaseRegion}` : ""}.
        These providers may use subprocessors and process information in
        other countries according to their services and settings. Their
        documentation describes their data handling and any applicable
        transfer safeguards.
      </p>
      <p>
        Account information is kept while your account is active. You can
        delete your account from the <Link href="/account">account page</Link>.
        This removes your authentication and profile data, but proposal
        records are retained for review and integrity purposes and are no
        longer linked to your account. Approved dictionary entries may remain
        public under the contribution license described in our{" "}
        <Link href="/terms">Terms and Conditions</Link>. Provider logs and
        backups are retained according to the providers' settings and
        policies.
      </p>

      <h2>Cookies and browser storage</h2>
      <p>
        Authentication cookies are used when you sign in. We do not use
        advertising or analytics cookies. Your browser's local storage saves
        the cookie-notice status, language preferences, and language display
        filter.
      </p>

      <h2>Your choices and privacy rights</h2>
      <p>
        On the <Link href="/account">account page</Link>, you can view and
        change your username and display name, and delete your account. Your
        email address is shown there but cannot currently be changed on that
        page. You may delete pending or rejected proposals. Depending on the
        laws that apply to you, you may also have
        privacy rights such as requesting access to, a copy of, or correction
        or deletion of your personal information, or objecting to or
        restricting certain uses. To make a request not available on the
        account page, use the <Link href="/contact">Contact page</Link>.
        We do not sell personal information or use it for advertising.
      </p>
    </article>
  );
}
