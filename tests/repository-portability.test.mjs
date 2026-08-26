import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)))
const packageFiles = ["backend/package.json", "frontend/package.json"]
const dependencyGroups = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]

test("pacotes não dependem de caminhos locais fora do repositório", () => {
  for (const relativePackageFile of packageFiles) {
    const packageFile = path.join(repositoryRoot, relativePackageFile)
    const manifest = JSON.parse(readFileSync(packageFile, "utf8"))

    for (const group of dependencyGroups) {
      for (const [dependency, specifier] of Object.entries(manifest[group] ?? {})) {
        if (typeof specifier !== "string" || !specifier.startsWith("file:")) continue

        const target = path.resolve(path.dirname(packageFile), specifier.slice("file:".length))
        const relativeTarget = path.relative(repositoryRoot, target)
        const isInsideRepository =
          relativeTarget === "" ||
          (!relativeTarget.startsWith(`..${path.sep}`) &&
            relativeTarget !== ".." &&
            !path.isAbsolute(relativeTarget))

        assert.ok(
          isInsideRepository,
          `${relativePackageFile}: ${dependency} aponta para fora do repositório (${specifier})`,
        )
      }
    }
  }
})
