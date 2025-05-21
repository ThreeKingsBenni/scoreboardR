import Config from "./lib/Config";
import UDPListener from "./lib/UdpListener";
import SchaufListener from "./plugins/scoreBoardVendor/schauf";
import MessageMocker from "./tests/mockSchaufSignal";

export const config = new Config().config;

switch (config.mode) {
  case "UDP":
    let udpListener: UDPListener;
    switch (config.pluginName) {
      case "schauf":
        udpListener = new SchaufListener();
        udpListener.listen();
        if(config.mocker){
          const mocker = new MessageMocker();
          mocker.mockMessage();
        }
        break;
      default:
        udpListener = new SchaufListener();
        udpListener.listen();
    }
    break;
}
