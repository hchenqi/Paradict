from pathlib import Path
from dataclasses import dataclass
import shutil
import json
import hashlib
import re
import subprocess


def remove(path: Path) -> None:
	if path.is_dir():
		shutil.rmtree(path)
	else:
		path.unlink(missing_ok=True)

def sql_path(path: str) -> str:
	return "'" + str(path).replace("'", "''") + "'"


CACHE = Path("data/.cache")
CACHE.mkdir(exist_ok=True)


class Node:
	def evaluate(self) -> str:
		raise NotImplementedError


@dataclass(frozen=True)
class String(Node):
	value: str

	def __init__(self, value):
		object.__setattr__(self, "value", str(value))
		object.__setattr__(self, "id", value)

	def evaluate(self) -> str:
		return self.value


@dataclass(frozen=True)
class Query(Node):
	inputs: tuple[tuple[str, Node], ...]
	sql: str

	def __init__(self, inputs: dict[str, Node], sql: str):
		object.__setattr__(self, "inputs", tuple(sorted(inputs.items())))
		object.__setattr__(self, "sql", sql)
		object.__setattr__(self, "output_names", tuple(sorted(set(re.findall(r"\{output\.(\w+)\}", sql)))))
		object.__setattr__(self, "id", hashlib.sha256(json.dumps([[[name, query.id] for name, query in self.inputs], self.sql], sort_keys=True, separators=(",", ":")).encode()).hexdigest())

	def cached(self) -> bool:
		return (CACHE / self.id).exists()

	@property
	def label(self) -> str:
		parts = [self.id[:12], "HIT" if self.cached() else "MIS", f"({", ".join(self.output_names)})" if self.output_names else ""]
		return " ".join([s for s in parts if s])

	def dependency(self) -> dict[str, Query]:
		result = {}
		for _, node in self.inputs:
			if isinstance(node, Output):
				node = node.query
			if isinstance(node, Query):
				result.update(node.dependency())
				result[node.id] = node
		return result

	def __getitem__(self, key: str) -> Output:
		if key not in self.output_names:
			raise KeyError(f"{self.label} has no output {key!r}")
		return Output(self, key)

	def evaluate(self) -> str:
		print(self.label)

		output = CACHE / self.id
		if output.exists():
			return sql_path(output)

		output_tmp = CACHE / (self.id + ".tmp") 
		sql = self.sql

		for name, node in self.inputs:
			sql = sql.replace("{" + name + "}", node.evaluate())

		sql = sql.replace("{output}", sql_path(output_tmp))
		for name in self.output_names:
			sql = sql.replace("{output." + name + "}", sql_path(output_tmp / name))

		remove(output_tmp)

		if self.output_names:
			output_tmp.mkdir()
		else:
			open(output_tmp, 'x').close()

		try:
			subprocess.run(["duckdb"], input=f".maxrows -1\n{sql}\n", text=True, check=True)
			output_tmp.rename(output)
		except BaseException:
			remove(output_tmp)
			raise

		return sql_path(output)


@dataclass(frozen=True)
class Output(Node):
	query: Query
	key: str

	def __init__(self, query: Query, key: str):
		object.__setattr__(self, "query", query)
		object.__setattr__(self, "key", key)
		object.__setattr__(self, "id", f"{query.id}:{key}")

	def evaluate(self) -> str:
		return sql_path(Path(self.query.evaluate().strip("'")) / self.key)


def print_trace(query: Query) -> None:
	for depencency in query.dependency().values():
		print(depencency.label)
	print(query.label)


def prune(*queries: Query) -> None:
	keep = set()

	for query in queries:
		keep |= {query.id, *query.dependency()}

	for path in CACHE.iterdir():
		if path.name not in keep:
			print("DELETE ", path.name[:12])
			remove(path)
