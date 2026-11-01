from query import *


def find_canonical(edges):
	return Query({ "edges": edges }, """--sql
		CREATE VIEW edges AS
			SELECT * FROM read_parquet({edges});

		CREATE TABLE nodes AS
			SELECT a AS id FROM edges
			UNION
			SELECT b AS id FROM edges;

		CREATE TABLE undirected_edges AS
			SELECT a AS src, b AS dst FROM edges
			UNION ALL
			SELECT b AS src, a AS dst FROM edges;

		COPY (
			WITH RECURSIVE
			connected_components(id, component, parent)
			USING KEY (id)
			AS (
				SELECT
					id,
					id AS component,
					id AS parent
				FROM nodes
				UNION ALL
				SELECT
					p.id,
					MIN(c.component) AS component,
					arg_min(c.id, c.component) AS parent
				FROM connected_components AS c
				JOIN undirected_edges AS e
					ON e.src = c.id
				JOIN recurring.connected_components AS p
					ON p.id = e.dst
				GROUP BY p.id, p.component
				HAVING MIN(c.component) < p.component
			)
			SELECT
				id,
				component AS canonical,
				parent
			FROM connected_components
		) TO {output} (FORMAT parquet);
	""")


def find_path(tree, node):
	return Query({ "tree": tree, "node": String(node) }, """--sql
		CREATE VIEW tree AS
			SELECT * FROM read_parquet({tree});

		WITH RECURSIVE path(id, parent, depth) AS (
			SELECT
				id,
				parent,
				0
			FROM tree
				WHERE id = {node}
			UNION ALL
			SELECT
				t.id,
				t.parent,
				p.depth + 1
			FROM path p
			JOIN tree t
				ON t.id = p.parent
				WHERE p.id != p.parent
		)
		SELECT id
		FROM path;
	""")
