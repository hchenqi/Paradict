PRAGMA memory_limit='8GB';
PRAGMA temp_directory='data/duckdb_spill';
PRAGMA threads=4;


-- =========================================================================
-- Import Entries
-- =========================================================================

CREATE VIEW entries AS
    SELECT * FROM read_csv('data/10_entries.tsv', delim='\t', header=true);


-- =========================================================================
-- Generate Hashes
-- =========================================================================

/*
CREATE VIEW hash_lang_expr AS
    SELECT * FROM read_csv('data/20_hash_lang_expr.tsv', delim='\t', header=true);
*/

CREATE TEMP TABLE hash_lang_expr AS
    SELECT
        row_number() OVER () AS eid,
        lang,
        expr
    FROM (
        SELECT DISTINCT
            lang,
            expr
        FROM entries
    );
COPY (
    SELECT *
    FROM hash_lang_expr
) TO 'data/20_hash_lang_expr.tsv' (HEADER, DELIMITER '\t');

/*
CREATE VIEW concepts_hash AS
    SELECT * FROM read_csv('data/21_concepts_hash.tsv', delim='\t', header=true);
*/

CREATE TEMP TABLE concepts_hash AS
    SELECT
        e.concept,
        h.eid
    FROM entries e
    JOIN hash_lang_expr h
        ON e.lang = h.lang AND e.expr = h.expr;
COPY (
    SELECT *
    FROM concepts_hash
) TO 'data/21_concepts_hash.tsv' (HEADER, DELIMITER '\t');


-- =========================================================================
-- Statistics
-- =========================================================================

/*
CREATE VIEW concepts_entry_count AS
    SELECT * FROM read_csv('data/22_concepts_entry_count.tsv', delim='\t', header=true);
*/

CREATE TEMP TABLE concepts_entry_count AS
    SELECT
        concept,
        COUNT(*) AS n
    FROM concepts_hash
    GROUP BY concept
    ORDER BY n DESC;
COPY (
    SELECT *
    FROM concepts_entry_count
) TO 'data/22_concepts_entry_count.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE hash_concept_count AS
    SELECT
        eid,
        COUNT(*) AS n
    FROM concepts_hash
    GROUP BY eid
    ORDER BY n DESC;
COPY (
    SELECT *
    FROM hash_concept_count
) TO 'data/22_hash_concept_count.tsv' (HEADER, DELIMITER '\t');

COPY (
    SELECT
        COUNT(*) AS count,
        MAX(n) AS max_n,

        quantile(n, 0.50) AS p50,
        quantile(n, 0.90) AS p90,
        quantile(n, 0.99) AS p99,
        quantile(n, 0.999) AS p999,

        COUNT(*) FILTER (WHERE n = 1) AS e1,
        COUNT(*) FILTER (WHERE n = 2) AS e2,
        COUNT(*) FILTER (WHERE n >= 3) AS ge3,
        COUNT(*) FILTER (WHERE n >= 10) AS ge10,
        COUNT(*) FILTER (WHERE n >= 100) AS ge100,
        COUNT(*) FILTER (WHERE n >= 1000) AS ge1000
    FROM concepts_entry_count
) TO 'data/23_stats_concepts_sum.tsv' (HEADER, DELIMITER '\t');

COPY (
    SELECT
        COUNT(*) AS count,
        MAX(n) AS max_n,

        quantile_cont(n, 0.50) AS p50,
        quantile_cont(n, 0.90) AS p90,
        quantile_cont(n, 0.99) AS p99,
        quantile_cont(n, 0.999) AS p999,

        COUNT(*) FILTER (WHERE n = 1) AS n_1,
        COUNT(*) FILTER (WHERE n BETWEEN 2 AND 4) AS n_2_4,
        COUNT(*) FILTER (WHERE n BETWEEN 5 AND 9) AS n_5_9,
        COUNT(*) FILTER (WHERE n BETWEEN 10 AND 99) AS n_10_99,
        COUNT(*) FILTER (WHERE n BETWEEN 100 AND 999) AS n_100_999,
        COUNT(*) FILTER (WHERE n >= 1000) AS n_1000_plus,

        SUM(n * (n - 1) / 2) AS pairs,
        SUM(n * (n - 1) / 2) FILTER (WHERE n = 1) AS pairs_1,
        SUM(n * (n - 1) / 2) FILTER (WHERE n BETWEEN 2 AND 4) AS pairs_2_4,
        SUM(n * (n - 1) / 2) FILTER (WHERE n BETWEEN 5 AND 9) AS pairs_5_9,
        SUM(n * (n - 1) / 2) FILTER (WHERE n BETWEEN 10 AND 99) AS pairs_10_99,
        SUM(n * (n - 1) / 2) FILTER (WHERE n BETWEEN 100 AND 999) AS pairs_100_999,
        SUM(n * (n - 1) / 2) FILTER (WHERE n >= 1000) AS pairs_1000_plus
    FROM hash_concept_count
) TO 'data/23_stats_hash_sum.tsv' (HEADER, DELIMITER '\t');

-- COPY (
--     SELECT
--         eid,
--         lang,
--         expr,
--         n
--     FROM hash_concept_count
--     JOIN hash_lang_expr USING (eid)
--     ORDER BY n DESC
--     LIMIT 2000
-- ) TO 'data/23_stats_hash_top_2000.tsv' (HEADER, DELIMITER '\t');


-- =========================================================================
-- Find and Remove Exact Duplicate Concepts with <= 3 Entries
-- =========================================================================

-- CREATE TEMP TABLE exact_dup_1 AS
--     SELECT
--         MIN(concept) AS canonical_concept,
--         LIST(concept ORDER BY concept) AS concepts
--     FROM concepts_hash
--     JOIN concepts_entry_count USING (concept)
--         WHERE n = 1
--     GROUP BY eid;
-- COPY (
--     SELECT *
--     FROM exact_dup_1
-- ) TO 'data/24_exact_dup_1.tsv' (HEADER, DELIMITER '\t');

-- CREATE TEMP TABLE exact_dup_2 AS
--     SELECT
--         MIN(concept) AS canonical_concept,
--         LIST(concept ORDER BY concept) AS concepts
--     FROM (
--         SELECT
--             concept,
--             LIST(eid ORDER BY eid) AS eid_2
--         FROM concepts_hash
--         JOIN concepts_entry_count USING (concept)
--             WHERE n = 2
--         GROUP BY concept
--     )
--     GROUP BY eid_2;
-- COPY (
--     SELECT *
--     FROM exact_dup_2
-- ) TO 'data/24_exact_dup_2.tsv' (HEADER, DELIMITER '\t');

-- CREATE TEMP TABLE exact_dup_concept_map AS
--     SELECT
--         concept,
--         MIN(concept) OVER (
--             PARTITION BY n, sig
--         ) AS canonical_concept
--     FROM (
--         SELECT
--             n,
--             concept,
--             LIST(eid ORDER BY eid) AS sig
--         FROM concepts_hash
--         JOIN concepts_entry_count USING (concept)
--             WHERE n BETWEEN 1 AND 3
--         GROUP BY n, concept
--     );
-- COPY (
--     SELECT *
--     FROM exact_dup_concept_map
-- ) TO 'data/24_exact_dup_concept_map.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE exact_dup_concepts AS
    SELECT
        concept
    FROM (
        SELECT
            n,
            concept,
            LIST(eid ORDER BY eid) AS sig
        FROM concepts_hash
        JOIN concepts_entry_count USING (concept)
            WHERE n BETWEEN 1 AND 3
        GROUP BY n, concept
    )
    QUALIFY concept != MIN(concept) OVER (
        PARTITION BY n, sig
    );
COPY (
    SELECT *
    FROM exact_dup_concepts
) TO 'data/24_exact_dup_concepts.tsv' (HEADER, DELIMITER '\t');

/*
CREATE VIEW concepts_hash_remaining AS
    SELECT * FROM read_csv('data/25_concepts_hash_remaining.tsv', delim='\t', header=true);
*/

CREATE TEMP TABLE concepts_hash_remaining AS
    SELECT ch.*
    FROM concepts_hash ch
    WHERE NOT EXISTS (
        SELECT 1
        FROM exact_dup_concepts d
        WHERE ch.concept = d.concept
    );
COPY (
    SELECT *
    FROM concepts_hash_remaining
) TO 'data/25_concepts_hash_remaining.tsv' (HEADER, DELIMITER '\t');


-- =========================================================================
-- Find Concept Pairs with >= 3 Entries Overlapping
-- =========================================================================

/*
CREATE VIEW concepts_hash_ge3 AS
    SELECT * FROM read_csv('data/25_concepts_hash_ge3.tsv', delim='\t', header=true);
*/

CREATE TEMP TABLE concepts_hash_ge3 AS
    SELECT ch.*
    FROM concepts_hash_remaining ch
    JOIN concepts_entry_count USING (concept)
        WHERE n >= 3;
COPY (
    SELECT *
    FROM concepts_hash_ge3
) TO 'data/25_concepts_hash_ge3.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE hash_concept_ge3_count AS
    SELECT
        eid,
        COUNT(*) AS n
    FROM concepts_hash_ge3
    GROUP BY eid
    ORDER BY n DESC;
COPY (
    SELECT *
    FROM hash_concept_ge3_count
) TO 'data/26_hash_concept_ge3_count.tsv' (HEADER, DELIMITER '\t');

COPY (
    SELECT
        COUNT(*) AS count,
        MAX(n) AS max_n,

        quantile_cont(n, 0.50) AS p50,
        quantile_cont(n, 0.90) AS p90,
        quantile_cont(n, 0.99) AS p99,
        quantile_cont(n, 0.999) AS p999,

        COUNT(*) FILTER (WHERE n = 1) AS n_1,
        COUNT(*) FILTER (WHERE n BETWEEN 2 AND 4) AS n_2_4,
        COUNT(*) FILTER (WHERE n BETWEEN 5 AND 9) AS n_5_9,
        COUNT(*) FILTER (WHERE n BETWEEN 10 AND 99) AS n_10_99,
        COUNT(*) FILTER (WHERE n BETWEEN 100 AND 999) AS n_100_999,
        COUNT(*) FILTER (WHERE n >= 1000) AS n_1000_plus,

        SUM(n * (n - 1) / 2) AS pairs,
        SUM(n * (n - 1) / 2) FILTER (WHERE n = 1) AS pairs_1,
        SUM(n * (n - 1) / 2) FILTER (WHERE n BETWEEN 2 AND 4) AS pairs_2_4,
        SUM(n * (n - 1) / 2) FILTER (WHERE n BETWEEN 5 AND 9) AS pairs_5_9,
        SUM(n * (n - 1) / 2) FILTER (WHERE n BETWEEN 10 AND 99) AS pairs_10_99,
        SUM(n * (n - 1) / 2) FILTER (WHERE n BETWEEN 100 AND 999) AS pairs_100_999,
        SUM(n * (n - 1) / 2) FILTER (WHERE n >= 1000) AS pairs_1000_plus
    FROM hash_concept_ge3_count
) TO 'data/26_stats_hash_ge3_sum.tsv' (HEADER, DELIMITER '\t');

/*
CREATE VIEW concept_overlap AS
    SELECT * FROM read_csv('data/27_concept_overlap.tsv', delim='\t', header=true);
*/

CREATE TEMP TABLE concept_overlap AS
    SELECT
        a.concept AS concept_a,
        b.concept AS concept_b
    FROM concepts_hash_ge3 a
    JOIN concepts_hash_ge3 b
        ON a.eid = b.eid AND a.concept < b.concept
    GROUP BY
        a.concept,
        b.concept
    HAVING COUNT(DISTINCT a.eid) >= 3;
COPY (
    SELECT *
    FROM concept_overlap
) TO 'data/27_concept_overlap.tsv' (HEADER, DELIMITER '\t');


-- =========================================================================
-- Find Connected Components and Build Map from Concept to Its Component
-- =========================================================================

CREATE VIEW edges AS
    SELECT
        concept_a AS a,
        concept_b AS b
    FROM concept_overlap;

CREATE TEMP TABLE nodes AS
    SELECT a AS id FROM edges
    UNION
    SELECT b AS id FROM edges;

CREATE TEMP TABLE undirected_edges AS
    SELECT a AS src, b AS dst FROM edges
    UNION ALL
    SELECT b AS src, a AS dst FROM edges;

CREATE TEMP TABLE concept_component_map AS
    WITH RECURSIVE
    connected_components(id, component)
    USING KEY (id)
    AS (
        SELECT
            id,
            id AS component
        FROM nodes
        UNION ALL
        SELECT
            p.id,
            MIN(c.component) AS component
        FROM connected_components AS c
        JOIN undirected_edges AS e
            ON e.src = c.id
        JOIN recurring.connected_components AS p
            ON p.id = e.dst
        GROUP BY p.id, p.component
        HAVING MIN(c.component) < p.component
    )
    SELECT id, component
    FROM connected_components;
COPY (
    SELECT *
    FROM concept_component_map
) TO 'data/28_concept_component_map.tsv' (HEADER, DELIMITER '\t');


-- =========================================================================
-- Final Tables
-- =========================================================================

CREATE TEMP TABLE concepts_hash_dedup AS
    SELECT DISTINCT
        coalesce(component, concept) as concept,
        eid
    FROM concepts_hash_remaining
    LEFT JOIN concept_component_map
        ON concept = id;
COPY (
    SELECT *
    FROM concepts_hash_dedup
) TO 'data/29_concepts_hash_dedup.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE entries_dedup AS
    SELECT
        concept,
        lang,
        expr
    FROM concepts_hash_dedup
    JOIN hash_lang_expr USING (eid);
COPY (
    SELECT *
    FROM entries_dedup
) TO 'data/29_entries_dedup.tsv' (HEADER, DELIMITER '\t');
