module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      externals: ['cap'],
      builderOptions: {
        productName: "EAO Radio Programmer",
        extraFiles: [
          "flasher"
        ]
      }
    }
  }
}