/* eslint no-console: 0 */
const createDependencyComparator = require("../src/createDependencyComparator")
const ui = require("./cli/ui")
const dayjs = require("dayjs")
const path = require("path")
const npmService = require("./npmService")
const fs = require("fs")

const SOURCE_TYPES = {
  GIT: "git",
  NPM: "npm"
}

const sourceToResolver = {
  [SOURCE_TYPES.NPM]: require("../src/npmPackageResolver"),
  [SOURCE_TYPES.GIT]: require("../src/gitPackageResolver")
}

const getSourceType = async source => {
  if (fs.existsSync(source)) {
    return SOURCE_TYPES.GIT
  } else {
    await npmService.view({
      moduleName: source,
      fieldName: "name"
    })

    return SOURCE_TYPES.NPM
  }
}

const checkDependencies = async ({
  priorDate,
  source,
  raw,
  latterDate,
  noColor
}) => {
  let resolvingSourceSpinner

  try {
    resolvingSourceSpinner = ui.spinner.start("Resolving source...")

    const sourceType = await getSourceType(source)

    ui.spinner.success(
      resolvingSourceSpinner,
      "Resolving dependency is completed:"
    )

    const { compareNpmModuleDependencies } = createDependencyComparator(
      sourceToResolver[sourceType]
    )

    if (raw) {
      compareNpmModuleDependencies(
        source,
        priorDate.valueOf(),
        latterDate.valueOf()
      )
        .then(res => console.log(res))
        .catch(err => console.error(err))
    } else {
      ui.printHeader({
        source: sourceType === SOURCE_TYPES.GIT ? path.resolve(source) : source,
        priorDate,
        latterDate
      })

      const comparingDependenciesSpinner = ui.spinner.start(
        "Comparing dependencies..."
      )

      compareNpmModuleDependencies(source, dayjs(priorDate), dayjs(latterDate))
        .then(res => {
          ui.spinner.success(
            comparingDependenciesSpinner,
            "Comparing dependencies is completed:"
          )
          ui.printSummary(res, noColor)
        })
        .catch(error => {
          ui.spinner.fail(
            comparingDependenciesSpinner,
            "😢 Something went wrong:"
          )
          console.error(error)
        })
    }
  } catch (error) {
    ui.spinner.fail(
      resolvingSourceSpinner,
      "😢 Such directory or npm package did not find:"
    )
    console.error(error)
  }
}

module.exports = {
  checkDependencies
}
