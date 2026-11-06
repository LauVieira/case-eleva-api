module.exports = {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "babel",
    collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
    testEnvironment: "node"
};
