import Config from "./lib/Config";
import UDPListener from "./lib/UdpListener";
import SchaufListener from "./plugins/scoreBoardVendor/schauf";

export const config = new Config().config;

switch (config.mode) {
  case "UDP":
    let udpListener: UDPListener;
    switch (config.pluginName) {
      case "schauf":
        udpListener = new SchaufListener();
        udpListener.listen();
        break;
      default:
        udpListener = new SchaufListener();
        udpListener.listen();
    }
    break;
}
