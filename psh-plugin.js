(function () {
  freeboard.loadWidgetPlugin({
    type_name: "PythonShell",
    display_name: "Python Shell",
    description: "A Python shell for Freeboard",
    external_scripts: ["plugins/freeboard/psh.js"],
    fill_size: false,
    settings: [],

    newInstance: function (settings, newInstanceCallback) {
      newInstanceCallback(new pshPlugin(settings));
    },
  });

  var pshPlugin = function (settings) {
    var self = this;
    var currentSettings = settings;
    var terminal = new psh({
      host: "127.0.0.1",
      port: 3333,
      debug: false,
      histSize: 20,
    });

    self.render = function (containerElement) {
      $(containerElement).append(terminal.htmlElement);
    };

    self.getHeight = function () {
      return 4;
    };

    self.onSettingsChanged = function (newSettings) {
      currentSettings = newSettings;
    };

    self.onCalculatedValueChanged = function (settingName, settingValue) {};

    self.onDispose = function () {
      terminal.close();
    };
  };
})();
