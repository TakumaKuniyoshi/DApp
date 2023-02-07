var valid_mm = false;
if (typeof window.ethereum !== 'undefined') {
  valid_mm = true;
  $("#valid_mm_log").html("MetaMaskが認識できました。");
}
else {
  valid_mm = false;
  $("#valid_mm_log").html("MetaMaskがインストールされていません。");
}

const wei2eth = 0.000000000000000001;
const eth2wei = 1000000000000000000;
 
var account_mm = "";
var network_id = 0;
var network_name = "";
var balance = 0;
 
async function connect_metamask() {
  valid_metamask();
 
  if(!valid_mm) {
    return;
  }
 
  $("#connect_mm_log").html("MetaMaskと接続中...");
 
  try {
    var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts.length > 0) {
 
      //https://chainlist.org/
      var network_names = {
        1: "イーサリアムメインネット",
        3: "Ropstenテストネットワーク",
        4: "Rinkebyテストネットワーク",
        42: "Kovanテストネットワーク",
        61: "イーサリアムClassicメインネット",
      };
 
      var network_id_raw = await window.ethereum.request({ method: 'eth_chainId' });
      network_id = parseInt(network_id_raw);
      network_name = "不明";
 
      if (network_id in network_names) {
        network_name = network_names[network_id];
      }
 
      var msg = "MetaMaskと接続できました。<br>接続しているネットワーク：" + network_name;
 
      account_mm = accounts[0];
      msg += "<br>アカウントのアドレス：" + account_mm;
 
      var amount = await window.ethereum.request({
        method: "eth_getBalance",
        params: [
          account_mm,
          "latest",
        ],
      });
      // wei -> ether
      balance = parseInt(amount) * wei2eth;
 
      msg += "<br>イーサリアム残高：" + balance + "ETH";
 
      $("#connect_mm_log").html(msg);
 
    }
  } catch (err) {
    if (err.code === 4001) {
      // EIP-1193 userRejectedRequest error
      $("#connect_mm_log").html("接続が拒否されました。<br>" + err.message);
    } else {
      console.error(err);
      $("#connect_mm_log").html("接続エラーが発生しました。<br>" + err.message);
    }
  }
}

window.ethereum.on("accountsChanged", (accountNo) => {
  connect_metamask();
});
 
window.ethereum.on("chainChanged", (accountNo) => {
  connect_metamask();
});

async function send_transaction() {
 
  trimingForm("to_address_txt");
  trimingForm("to_amounts_txt");
  trimingForm("to_data_txt");
  var to_data_txt = $("#to_data_txt").val();
  if (to_data_txt.length > 0) {
    to_data_txt = to_data_txt.replace(/\r\n/g, "\n");
    to_data_txt = to_data_txt.replace(/\n/g, "");
  }
  else {
    to_data_txt = "";
  }
 
  if($("#to_address_txt").val().length <= 0 ||
    $("#to_amounts_txt").val().length <= 0) {
    $("#send_amounts_log").html("正しい値を入力してください。");
    return;
  }
 
  connect_metamask();
 
  if(network_id == 1 || network_id == 61) {
    $("#send_amounts_log").html("本番ネットワークでの送金はできません。");
    return;
  }
 
  if(parseFloat($("#to_amounts_txt").val()) > balance) {
    $("#send_amounts_log").html("送金額相当のETHを保持していないようです。");
    return;
  }
 
  if($("#to_address_txt").val() == window.ethereum.selectedAddress) {
    $("#send_amounts_log").html("自分自身への送金はできません。");
    return;
  }
 
  $("#send_amounts_log").html("送金トランザクション実行中...");
 
  try {
 
    var send_wei = parseFloat($("#to_amounts_txt").val()) * eth2wei;
    var send_wei_str = "0x" + send_wei.toString(16);
    var send_params = {
      nonce: '0x00',
      gasPrice: '', 
      gas: '',
      to: $("#to_address_txt").val(),
      from: window.ethereum.selectedAddress,
      value: send_wei_str,
      data: to_data_txt,
      chainId: '',
    };
 
    var transaction_id = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [send_params],
    });
 
    $("#send_amounts_log").html("トランザクション完了：ID " + transaction_id);
  }
 
  catch (err) {
    console.error(err);
    $("#send_amounts_log").html("トランザクションエラーが発生しました。<br>" + err.message);
  }
}