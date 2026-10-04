from pathlib import Path
from dataclasses import dataclass
import shutil
import sys
import json
import hashlib
import re
import subprocess


def remove(path: Path) -> None:
	if path.is_dir():
		shutil.rmtree(path)
	else:
		path.unlink(missing_ok=True)

def sql_path(path: Path) -> str:
	return "'" + str(path).replace("'", "''") + "'"


CACHE = Path("data/.cache")
CACHE.mkdir(exist_ok=True)


@dataclass(frozen=True)
class Query:
	inputs: tuple[tuple[str, Query], ...]
	sql: str

	def __init__(self, inputs: dict[str, Query], sql: str):
		input_names = set(re.findall(r"\{(\w+)(?:\.\w+)?\}", sql)) - {"output"}
		if input_names - inputs.keys():
			raise ValueError(f"Query uses undefined inputs: {sorted(input_names - inputs.keys())}")
		if inputs.keys() - input_names:
			raise ValueError(f"Query does not use inputs: {sorted(inputs.keys() - input_names)}")
		object.__setattr__(self, "scope", sys._getframe(1).f_globals)
		object.__setattr__(self, "inputs", tuple(sorted(inputs.items())))
		object.__setattr__(self, "sql", sql)
		object.__setattr__(self, "output_names", tuple(sorted(set(re.findall(r"\{output\.(\w+)\}", sql)))))
		object.__setattr__(self, "id", hashlib.sha256(json.dumps([[[name, query.id] for name, query in self.inputs], self.sql], sort_keys=True, separators=(",", ":")).encode()).hexdigest())

	def cached(self) -> bool:
		return (CACHE / self.id).exists()

	@property
	def name(self) -> str:
		for name, value in self.scope.items():
			if value is self:
				return name
		return ""

	@property
	def label(self) -> str:
		parts = [self.id[:12], "HIT" if self.cached() else "MIS", self.name, f"({", ".join(self.output_names)})" if self.output_names else ""]
		return " ".join([s for s in parts if s])

	def dependency(self) -> dict[str, Query]:
		result = {}
		for _, query in self.inputs:
			result.update(query.dependency())
			result[query.id] = query
		return result

	def print_trace(self) -> None:
		for query in self.dependency().values():
			print(query.label)
		print(self.label)

	def prune(self) -> None:
		trace = {self.id, *self.dependency()}
		for path in CACHE.iterdir():
			if path.name not in trace:
				print("DELETE ", path.name[:12])
				remove(path)

	def materialize(self) -> Path:
		print(self.label)

		output = CACHE / self.id
		if output.exists():
			return output

		output_tmp = CACHE / (self.id + ".tmp") 
		outputs = [output_tmp / name for name in self.output_names] or [output_tmp]
		sql = self.sql

		for name, query in self.inputs:
			path = query.materialize()
			sql = sql.replace("{" + name + "}", sql_path(path))
			sql = re.sub(r"\{" + name + r"\.(\w+)\}", lambda m: sql_path(path / m[1]), sql)

		for name in self.output_names:
			sql = sql.replace("{output." + name + "}", sql_path(output_tmp / name))

		sql = sql.replace("{output}", sql_path(output_tmp))

		remove(output_tmp)

		if self.output_names:
			output_tmp.mkdir()

		try:
			subprocess.run(["duckdb", "-c", sql], check=True)

			for path in outputs:
				if not path.exists():
					raise RuntimeError(f"Query did not create its output: {path}")

			output_tmp.rename(output)

		except BaseException:
			remove(output_tmp)
			raise

		return output
