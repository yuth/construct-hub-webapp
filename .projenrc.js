const { web } = require("projen");

const project = new web.ReactTypeScriptProject({
  defaultReleaseBranch: "main",
  name: "construct-hub-webapp",
  projenUpgradeSecret: "CDK_AUTOMATION_GITHUB_TOKEN",

  // Author metadata
  authorEmail: "construct-ecosystem-team@amazon.com",
  authorName: "Amazon Web Services, Inc.",

  // Repository information
  repository: "https://github.com/cdklabs/construct-hub-webapp.git",

  // since this is an app project, we need to enable these explicitly
  // in order to be able to publish this as an npm module.
  releaseToNpm: true,
  releaseWorkflow: true,
  package: true,

  eslint: true,
  eslintOptions: {
    prettier: true,
  },

  deps: [
    "@chakra-ui/react",
    "@emotion/react@^11",
    "@emotion/styled@^11",
    "chakra-ui-markdown-renderer",
    "framer-motion@^4",
    "react-router-dom",
    "@uiw/react-markdown-preview",
    "jsii-reflect",
    "@jsii/spec",
    "codemaker",
  ],

  devDeps: [
    "@types/react-router-dom",
    "react-app-rewired",
    "@testing-library/react-hooks",
  ],
});

(function addStorybook() {
  project.addDevDeps(
    "@storybook/addon-actions",
    "@storybook/addon-essentials",
    "@storybook/addon-links",
    "@storybook/node-logger",
    "@storybook/preset-create-react-app",
    "@storybook/react",
    "babel-loader@8.1.0"
  );

  // Add tasks and config for storybook
  project.addTask("storybook", {
    exec: "start-storybook -p 6006 -s public",
    description: "run local storybook server",
  });

  const buildTask = project.addTask("storybook:build", {
    exec: "build-storybook -s public",
    description: "build storybook static site assets",
  });
  project.compileTask.prependSpawn(buildTask);

  project.eslint.addOverride({
    files: ["**/*.stories.*"],
    rules: {
      "import/no-anonymous-default-export": "off",
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: ["**/*.stories.*"],
          optionalDependencies: false,
          peerDependencies: true,
        },
      ],
    },
  });

  project.gitignore?.addPatterns("/storybook-static/");
})();

// synthesize project files before build
// see https://github.com/projen/projen/issues/754
const buildTask = project.tasks.tryFind("build");
buildTask.spawn(project.packageTask);
buildTask.prependSpawn(project.testTask);
buildTask.prependSpawn(project.compileTask);
buildTask.prependExec("npx projen");

// npm tarball will only include the contents of the "build"
// directory, which is the output of our static website.
project.npmignore.addPatterns("!/build");
project.npmignore.addPatterns("/public");

// test fixtures
project.npmignore.addPatterns("src/__fixtures__");

const fetchAssemblies = project.addTask("dev:fetch-assemblies");
fetchAssemblies.exec(`node scripts/fetch-assemblies.js`);

// these are development assemblies fetched specifically
// by each developer.
project.gitignore.exclude("public/packages");

// Proxy requests to awscdk.io for local testing
project.package.addField("proxy", "https://awscdk.io");

// setup linting for create-react-app specific tools
project.eslint.addRules({
  "import/no-extraneous-dependencies": [
    "error",
    {
      devDependencies: ["**/setupTests.ts", "**/*.test.tsx", "**/*.test.ts"],
      optionalDependencies: false,
      peerDependencies: true,
    },
  ],
});

// rewire cra tasks, all apart from eject.
rewireCRA(buildTask);
rewireCRA(project.tasks.tryFind("test"));
rewireCRA(project.tasks.tryFind("dev"));

project.synth();

/**
 * Rewire a create-react-app task to use 'react-app-rewired` instead of 'react-scripts'
 * so that our configuration overrides will take affect.
 *
 * @see https://www.npmjs.com/package/react-app-rewired
 */
function rewireCRA(craTask) {
  for (const step of craTask.steps) {
    if (step.exec?.startsWith("react-scripts")) {
      step.exec = step.exec.replace("react-scripts", "react-app-rewired");
    }
  }
}
