import { legalInfo } from "@/lib/legal-info";

export default function TermsPage() {
  return (
    <article>
      <h1>Terms and Conditions</h1>

      <h2>Service and provider</h2>
      <p>
        Paradict is a free, community-maintained multilingual dictionary. The
        service provider is {legalInfo.name || "[Set LEGAL_INFO_NAME]"}.
        Contact: {legalInfo.contactEmail ? (
          <a href={`mailto:${legalInfo.contactEmail}`}>{legalInfo.contactEmail}</a>
        ) : "[Set LEGAL_INFO_CONTACT_EMAIL]"}.
      </p>

      <h2>Accounts and acceptable use</h2>
      <p>
        An account is required to submit suggestions. Keep your account
        credentials secure and provide an email address you control. Use the
        service lawfully. Do not submit unlawful, confidential, personal, or
        infringing material, or attempt to disrupt or gain unauthorised access
        to the service. You may only submit material that you are entitled to
        license. Submissions are reviewed and may be rejected or removed.
      </p>
      <p>
        To report potentially illegal content or an infringement, contact us
        at the email address above with the content URL and an explanation. We
        will review the notice and may remove the content or restrict access
        where appropriate.
      </p>

      <h2>License for contributions</h2>
      <p>
        By submitting a contribution to Paradict, you dedicate that
        contribution to the public domain under the{" "}
        <a href="https://creativecommons.org/publicdomain/zero/1.0/">
          Creative Commons CC0 1.0 Universal Public Domain Dedication
        </a>
        , to the extent legally possible. Where that dedication is not
        effective, you grant the service provider and the public a worldwide,
        royalty-free, non-exclusive, irrevocable license to use, reproduce,
        modify, distribute, and make the contribution publicly available,
        including as part of the dictionary and derivative data, without
        attribution. You confirm that you have the rights required to grant
        these permissions. Do not submit material for which you cannot grant
        them. Mandatory statutory rights remain unaffected.
      </p>
      <p>
        You retain any rights not granted by this license. If your proposal is
        approved and merged, the license applies to the resulting dictionary
        data in the public core database and continues even if the proposal
        record or your account is later deleted. You may delete pending or
        rejected proposals. Deleting your account removes your profile and
        unlinks your proposal records from you, but those records may be
        retained for review and integrity purposes. Deleting a proposal does
        not revoke a license already granted for material incorporated into
        the dictionary. The contribution terms are fixed for this project;
        any future project would have its own terms.
      </p>

      <h2>Source data and copyright</h2>
      <p>
        The seed data is based on{" "}
        <a href="https://huggingface.co/datasets/cointegrated/panlex-meanings">
          cointegrated/panlex-meanings
        </a>
        , whose dataset card states that it is released under CC0 1.0. That
        statement concerns the source dataset and does not guarantee rights in
        other material. Paradict software is not licensed by that dataset
        license. A separate software license applies only if published for
        this project.
      </p>

      <h2>Availability and liability</h2>
      <p>
        Paradict is a free dictionary service for general language reference.
        Entries, translations, and meaning associations may be incomplete,
        outdated, or inaccurate. Please verify information before relying on
        it, especially where accuracy is important. The service and its
        content are provided “as is” and “as available,” without a guarantee
        that they will be accurate, complete, current, or uninterrupted, to
        the extent permitted by law. Nothing in these terms excludes or limits
        liability that cannot legally be excluded or limited.
      </p>

      <h2>Contact</h2>
      <p>
        Contact{" "}
        {legalInfo.contactEmail ? (
          <a href={`mailto:${legalInfo.contactEmail}`}>{legalInfo.contactEmail}</a>
        ) : "[Set LEGAL_INFO_CONTACT_EMAIL]"}{" "}
        with questions.
      </p>
    </article>
  );
}
