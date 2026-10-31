import Link from "next/link";

export default function TermsPage() {
  return (
    <article>
      <h1>Terms and Conditions</h1>
      <p>
        These terms explain how to use Paradict and what applies when you
        submit a dictionary contribution.
      </p>

      <h2>Data source and copyright</h2>
      <p>
        The seed data is based on{" "}
        <a href="https://huggingface.co/datasets/cointegrated/panlex-meanings">
          cointegrated/panlex-meanings
        </a>
        , a dataset derived from PanLex whose dataset card states that it is
        released under CC0 1.0. The source dataset's license applies to that dataset
        only and does not guarantee rights in other material.
      </p>
      <p>
        The dictionary also includes entries submitted by the community. Paradict
        dictionary data, including community contributions, is also dedicated
        to the public domain under{" "}
        <a href="https://creativecommons.org/publicdomain/zero/1.0/">
          CC0 1.0
        </a>
        , to the extent legally possible.
      </p>
      <p>
        This license does
        not apply to Paradict software; a separate software license applies
        only if published for this project.
      </p>

      <h2>Using the dictionary</h2>
      <ul>
        <li>
          <strong>Choose languages:</strong> Click{" "}
          <strong>All languages</strong> to open the language list, then click
          language buttons to select or deselect them. Click selected language
          buttons to turn them on or off for searching and display. Your
          choices are saved in this browser.
        </li>
        <li>
          <strong>Explore concepts:</strong> Browse the{" "}
          <Link href="/explore">Explore</Link> page for a random selection of concepts.
          Click a concept title to view its entire entries.
        </li>
        <li>
          <strong>Search:</strong> Enter a word or phrase in the Search box and
          click the search button. Matching entries are grouped by concepts.
          Click a concept title to open it. In search results, click{" "}
          <strong>select for compare</strong> on a concept, then open another
          concept to compare their entries.
        </li>
        <li>
          <strong>View and compare concepts:</strong> On a concept page, choose “all
          languages,” “selected languages,” or “active languages” from the
          display menu. To compare by ID, enter the other concept's ID and
          click <strong>Compare</strong>.
        </li>
        <li>
          <strong>Edit a concept:</strong> Click <strong>Edit</strong> to
          enter edit mode. Use the entry field and <strong>Add</strong> button
          to propose an entry for a language, or click the minus button beside
          an entry to propose removing it. Click <strong>View</strong> to leave
          edit mode; proposed changes are sent for review when you click{" "}
          <strong>Submit</strong>. Accepted proposals are merged in the public dictionary.
        </li>
        <li>
          <strong>Suggest a new concept:</strong> Click{" "}
          <strong>Suggest a new concept</strong> below search results to edit an
          empty concept and submit.
        </li>
      </ul>

      <h2>Contributing</h2>
      <p>
        To submit contributions, you must <Link href="/login?mode=signup">register</Link> with
        an email address. Keep your account credentials secure and use the service lawfully. Do
        not submit unlawful or infringing material, or attempt to disrupt or
        gain unauthorised access to the service. Submissions are reviewed and
        may be rejected or removed.
      </p>
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
        or your account is later deleted. Deleting a proposal does not revoke
        a license already granted for material incorporated into the
        dictionary. The contribution terms are fixed for this project; any
        future project would have its own terms.
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

      <h2>Report an issue</h2>
      <p>
        To report potentially illegal content or an infringement,{" "}
        <Link href="/contact">contact us</Link> including the content URL
        with an explanation. We will review the notice and may remove the
        content or restrict access where appropriate.
      </p>
    </article>
  );
}
