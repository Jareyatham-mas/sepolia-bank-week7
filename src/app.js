import { BrowserProvider, Contract, Interface, parseEther } from "ethers";
import BANK_ABI from "./contract/Bank.abi.json";
import "./styles.css";

/* Set this after deploying Bank.sol to Sepolia. Keep the 0x prefix. */
const BANK_CONTRACT_ADDRESS = "0xd7C4B883481c901A7a61004391e92971f4B20843";

const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_HEX_CHAIN_ID = "0xaa36a7";

const elements = {
  connectButton: document.querySelector("#connect-button"),
  switchNetworkButton: document.querySelector("#switch-network-button"),
  walletStatus: document.querySelector("#wallet-status"),
  walletAddress: document.querySelector("#wallet-address"),
  balanceValue: document.querySelector("#balance-value"),
  refreshButton: document.querySelector("#refresh-button"),
  depositForm: document.querySelector("#deposit-form"),
  depositAmount: document.querySelector("#deposit-amount"),
  withdrawForm: document.querySelector("#withdraw-form"),
  withdrawAmount: document.querySelector("#withdraw-amount"),
  statusPanel: document.querySelector("#status-panel"),
  statusMessage: document.querySelector("#status-message"),
  networkPill: document.querySelector(".network-pill"),
};

let provider;
let signer;
let account = "";
let chainId = 0n;
let lastStatus = ["เชื่อม MetaMask เพื่อเริ่มใช้งาน"];
let lastCopyMessage = "";
let infuraEndpoint = "";
let rpcMessage = "อ่านยอดผ่าน MetaMask";
let rpcAttempt;
const bankInterface = new Interface(BANK_ABI);
const english = {
  "อ่านยอดผ่าน MetaMask": "Reading balances through MetaMask.",
  "กำลังตรวจ Infura": "Checking Infura…",
  "เชื่อม Infura Sepolia แล้ว": "Connected to Infura Sepolia.",
  "เชื่อม Infura ไม่สำเร็จ ตรวจสอบ API key หรือ endpoint": "Could not connect to Infura. Check the API key or endpoint.",
  "Infura อ่านยอดไม่สำเร็จ": "Could not read the balance through Infura.",
  "เชื่อมต่อแล้ว": "Connected",
  "ยังไม่ได้เชื่อมต่อ": "Not connected",
  "เชื่อม MetaMask เพื่อเริ่มใช้งาน": "Connect MetaMask to get started",
  "เชื่อมต่อ MetaMask": "Connect MetaMask",
  "เปลี่ยนเครือข่ายเป็น Sepolia": "Switch to Sepolia",
  "ดูธุรกรรมบน Etherscan": "View transaction on Etherscan",
  "อ่านยอดคงเหลือไม่สำเร็จ": "Could not read the balance.",
  "เชื่อมต่อ Bank บน Sepolia แล้ว": "Connected to Bank on Sepolia.",
  "ยังไม่ได้ตั้งค่า contract address ใน app.js": "The Bank contract address is missing.",
  "กรุณาสลับ MetaMask เป็น Sepolia เพื่อใช้งานสัญญา": "Switch MetaMask to Sepolia to use Bank.",
  "เชื่อมต่อแล้ว กรุณาสลับเครือข่ายเป็น Sepolia เพื่อใช้งานสัญญา": "Wallet connected. Switch to Sepolia to use Bank.",
  "เชื่อมต่อแล้ว ให้นำ contract address หลัง deploy ไปใส่ใน app.js": "The deployed Bank address is missing.",
  "เชื่อมต่อ MetaMask สำเร็จ": "MetaMask connected.",
  "เชื่อมต่อ wallet ไม่สำเร็จ": "Could not connect the wallet.",
  "สลับไป Sepolia ไม่สำเร็จ": "Could not switch to Sepolia.",
  "ส่งธุรกรรมแล้ว กำลังรอการยืนยัน": "Transaction sent. Waiting for confirmation.",
  "ธุรกรรมไม่สำเร็จ": "Transaction failed.",
  "คัดลอกแล้ว": "Address copied.",
  "เลือกและคัดลอกที่อยู่ด้านบนได้เลย": "Select and copy the address above.",
  "จำนวนฝากต้องมากกว่า 0 ETH": "Enter a deposit greater than 0 ETH.",
  "จำนวนถอนต้องมากกว่า 0 ETH": "Enter a withdrawal greater than 0 ETH.",
  "ฝาก ETH สำเร็จ": "ETH deposited.",
  "ถอน ETH สำเร็จ": "ETH withdrawn.",
  "ยอดเงินในสัญญาไม่เพียงพอ": "Insufficient balance in the Bank contract.",
  "กรุณาตรวจสอบจำนวน ETH": "Check the ETH amount.",
  "ไม่พบ MetaMask กรุณาติดตั้งหรือเปิดใช้งานส่วนขยาย MetaMask": "Install or enable the MetaMask extension to continue.",
  "กรุณาเชื่อมต่อ MetaMask ก่อน": "Connect MetaMask first.",
  "กรุณาสลับ MetaMask ไปยัง Sepolia Testnet": "Switch MetaMask to Sepolia.",
  "ไม่พบ MetaMask: สามารถอ่านหน้าเว็บได้ แต่ต้องติดตั้ง MetaMask เพื่อฝากหรือถอน ETH": "Install MetaMask to deposit or withdraw ETH.",
  "เปิดหน้านี้ผ่าน file:// อยู่ — ให้เปิดผ่าน localhost หรือ GitHub Pages ก่อนเชื่อม MetaMask": "Open on localhost or GitHub Pages before connecting MetaMask.",
  "ไม่พบ MetaMask ในเบราว์เซอร์นี้ กรุณาเปิดส่วนขยาย MetaMask แล้วโหลดหน้าใหม่": "MetaMask was not detected. Enable it and reload.",
  "ตั้งค่า contract address ใน app.js หลัง deploy Bank.sol บน Sepolia": "Configure the Bank contract address for Sepolia."
};

function readPreference(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function savePreference(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Apply for this page only. */ }
}

let language = readPreference("bank-language") === "en" ? "en" : "th";
let theme = readPreference("bank-theme") === "dark" ? "dark" : "light";
const translate = (message) => language === "en" ? english[message] ?? message : message;

function setStatus(message, kind = "info", transactionHash = "") {
  lastStatus = [message, kind, transactionHash];
  elements.statusPanel.dataset.kind = kind;
  elements.statusMessage.textContent = translate(message);
  if (transactionHash) {
    const link = document.createElement("a");
    link.href = `https://sepolia.etherscan.io/tx/${encodeURIComponent(transactionHash)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = ` ${translate("ดูธุรกรรมบน Etherscan")}`;
    elements.statusMessage.append(link);
  }
}

function isContractConfigured() {
  return /^0x[a-fA-F0-9]{40}$/.test(BANK_CONTRACT_ADDRESS);
}

function shortenAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatEth(value) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const unit = 10n ** 18n;
  const whole = absolute / unit;
  const fraction = (absolute % unit).toString().padStart(18, "0").slice(0, 6).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function setBusy(busy) {
  document.querySelectorAll("button, input").forEach((control) => {
    control.disabled = busy;
  });
}

function updateWalletView() {
  elements.walletStatus.textContent = translate(account ? "เชื่อมต่อแล้ว" : "ยังไม่ได้เชื่อมต่อ");
  elements.walletAddress.textContent = account || translate("เชื่อม MetaMask เพื่อเริ่มใช้งาน");
  elements.connectButton.textContent = account ? shortenAddress(account) : translate("เชื่อมต่อ MetaMask");
  elements.switchNetworkButton.hidden = !account || chainId === SEPOLIA_CHAIN_ID;
  elements.networkPill.dataset.kind = chainId === SEPOLIA_CHAIN_ID ? "success" : "warning";
  elements.networkPill.lastChild.textContent = !account || chainId === SEPOLIA_CHAIN_ID
    ? " Sepolia Testnet"
    : ` ${translate("เปลี่ยนเครือข่ายเป็น Sepolia")}`;
}

function requireReady() {
  if (!window.ethereum) throw new Error("ไม่พบ MetaMask กรุณาติดตั้งหรือเปิดใช้งานส่วนขยาย MetaMask");
  if (!account || !signer) throw new Error("กรุณาเชื่อมต่อ MetaMask ก่อน");
  if (chainId !== SEPOLIA_CHAIN_ID) throw new Error("กรุณาสลับ MetaMask ไปยัง Sepolia Testnet");
  if (!isContractConfigured()) throw new Error("ยังไม่ได้ตั้งค่า contract address ใน app.js");
}

function getBank() {
  return new Contract(BANK_CONTRACT_ADDRESS, BANK_ABI, signer);
}

function parseInfuraEndpoint(input) {
  const endpoint = new URL(/^[a-zA-Z0-9_-]{16,128}$/.test(input)
    ? `https://sepolia.infura.io/v3/${input}`
    : input);
  if (endpoint.origin !== "https://sepolia.infura.io" ||
      !/^\/v3\/[a-zA-Z0-9_-]{16,128}$/.test(endpoint.pathname) ||
      endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error("Invalid Infura Sepolia endpoint");
  }
  return endpoint.href;
}

async function rpcCall(endpoint, method, params, signal) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal,
    redirect: "error",
    credentials: "omit",
  });
  if (!response.ok) throw new Error("RPC request failed");
  const payload = await response.json();
  if (payload.error || payload.result == null) throw new Error("Invalid RPC response");
  return payload.result;
}

async function refreshBalance() {
  const currentAccount = account;
  const endpoint = infuraEndpoint;
  try {
    requireReady();
    const result = endpoint ? await rpcCall(endpoint, "eth_call", [{
      to: BANK_CONTRACT_ADDRESS,
      from: currentAccount,
      data: bankInterface.encodeFunctionData("checkBalance"),
    }, "latest"], AbortSignal.timeout(10000)) : null;
    const balance = result == null
      ? await getBank().checkBalance()
      : bankInterface.decodeFunctionResult("checkBalance", result)[0];
    if (account === currentAccount && endpoint === infuraEndpoint) {
      elements.balanceValue.textContent = formatEth(balance);
    }
    return true;
  } catch (error) {
    if (account !== currentAccount || endpoint !== infuraEndpoint) return false;
    elements.balanceValue.textContent = "—";
    setStatus(endpoint && account && chainId === SEPOLIA_CHAIN_ID
      ? "Infura อ่านยอดไม่สำเร็จ"
      : error.message || "อ่านยอดคงเหลือไม่สำเร็จ", "error");
    return false;
  }
}

async function readWalletState() {
  if (!window.ethereum) return;
  provider = new BrowserProvider(window.ethereum);
  const [accounts, network] = await Promise.all([
    provider.send("eth_accounts", []),
    provider.getNetwork(),
  ]);
  chainId = network.chainId;
  account = accounts[0] || "";
  signer = account ? await provider.getSigner(account) : undefined;
  elements.balanceValue.textContent = "—";
  updateWalletView();
  if (account) {
    if (chainId !== SEPOLIA_CHAIN_ID) {
      setStatus("กรุณาสลับ MetaMask เป็น Sepolia เพื่อใช้งานสัญญา", "error");
    } else if (!isContractConfigured()) {
      setStatus("ยังไม่ได้ตั้งค่า contract address ใน app.js", "error");
    } else if (await refreshBalance()) {
      setStatus("เชื่อมต่อ Bank บน Sepolia แล้ว", "success");
    }
  }
}

async function connectWallet() {
  try {
    if (!window.ethereum) throw new Error("ไม่พบ MetaMask กรุณาติดตั้งหรือเปิดใช้งานส่วนขยาย MetaMask");
    provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    await readWalletState();
  } catch (error) {
    setStatus(error.message || "เชื่อมต่อ wallet ไม่สำเร็จ", "error");
  }
}

async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }],
    });
  } catch (error) {
    setStatus(error.message || "สลับไป Sepolia ไม่สำเร็จ", "error");
  }
}

async function sendTransaction(action, successMessage) {
  setBusy(true);
  try {
    requireReady();
    const tx = await action();
    setStatus("ส่งธุรกรรมแล้ว กำลังรอการยืนยัน", "info", tx.hash);
    await tx.wait();
    await refreshBalance();
    setStatus(successMessage, "success", tx.hash);
    return true;
  } catch (error) {
    setStatus(error.shortMessage || error.reason || error.message || "ธุรกรรมไม่สำเร็จ", "error");
    return false;
  } finally {
    setBusy(false);
  }
}

elements.connectButton.addEventListener("click", connectWallet);
elements.switchNetworkButton.addEventListener("click", switchToSepolia);
elements.refreshButton.addEventListener("click", refreshBalance);

const contractAddress = document.querySelector("#contract-address");
const copyContract = document.querySelector("#copy-contract");
const contractExplorer = document.querySelector("#contract-explorer");
const copyFeedback = document.querySelector("#copy-feedback");
const languageToggle = document.querySelector("#language-toggle");
const themeToggle = document.querySelector("#theme-toggle");
const translationNodes = Array.from(document.querySelectorAll("[data-en]"), (node) => ({
  node, thai: node.textContent, english: node.dataset.en,
}));

function renderTheme() {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.setAttribute("aria-label", language === "en" ? "Dark mode" : "โหมดมืด");
  themeToggle.firstElementChild.textContent = dark ? "☀" : "☾";
}

function renderLanguage() {
  const isEnglish = language === "en";
  document.documentElement.lang = language;
  document.querySelector(".dashboard").setAttribute("aria-label", isEnglish ? "Bank dashboard" : "บัญชีธนาคาร");
  for (const item of translationNodes) item.node.textContent = isEnglish ? item.english : item.thai;
  languageToggle.textContent = isEnglish ? "ไทย" : "EN";
  languageToggle.setAttribute("aria-label", isEnglish ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English");
  updateWalletView();
  setStatus(...lastStatus);
  copyFeedback.textContent = translate(lastCopyMessage);
  document.querySelector("#rpc-status").textContent = translate(rpcMessage);
  renderTheme();
}

languageToggle.addEventListener("click", () => {
  language = language === "en" ? "th" : "en";
  savePreference("bank-language", language);
  renderLanguage();
});

themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  savePreference("bank-theme", theme);
  renderTheme();
});

renderLanguage();

const rpcInput = document.querySelector("#rpc-input");
function showRpcStatus(message) {
  rpcMessage = message;
  document.querySelector("#rpc-status").textContent = translate(message);
}

document.querySelector("#rpc-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  rpcAttempt?.abort();
  const attempt = new AbortController();
  rpcAttempt = attempt;
  const input = rpcInput.value.trim();
  rpcInput.value = "";
  showRpcStatus("กำลังตรวจ Infura");
  try {
    const endpoint = parseInfuraEndpoint(input);
    const chain = await rpcCall(endpoint, "eth_chainId", [], AbortSignal.any([attempt.signal, AbortSignal.timeout(10000)]));
    if (attempt.signal.aborted) return;
    if (BigInt(chain) !== SEPOLIA_CHAIN_ID) throw new Error("Wrong chain");
    infuraEndpoint = endpoint;
    showRpcStatus("เชื่อม Infura Sepolia แล้ว");
    if (account && chainId === SEPOLIA_CHAIN_ID) await refreshBalance();
  } catch {
    if (!attempt.signal.aborted) {
      infuraEndpoint = "";
      showRpcStatus("เชื่อม Infura ไม่สำเร็จ ตรวจสอบ API key หรือ endpoint");
      if (account && chainId === SEPOLIA_CHAIN_ID) await refreshBalance();
    }
  } finally {
    if (rpcAttempt === attempt) rpcAttempt = undefined;
  }
});

document.querySelector("#reset-rpc").addEventListener("click", () => {
  rpcAttempt?.abort();
  infuraEndpoint = "";
  rpcInput.value = "";
  showRpcStatus("อ่านยอดผ่าน MetaMask");
  if (account && chainId === SEPOLIA_CHAIN_ID) refreshBalance();
});

contractAddress.textContent = BANK_CONTRACT_ADDRESS;
contractExplorer.href = `https://sepolia.etherscan.io/address/${BANK_CONTRACT_ADDRESS}`;
copyContract.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(BANK_CONTRACT_ADDRESS);
    lastCopyMessage = "คัดลอกแล้ว";
  } catch {
    lastCopyMessage = "เลือกและคัดลอกที่อยู่ด้านบนได้เลย";
  }
  copyFeedback.textContent = translate(lastCopyMessage);
});

elements.depositForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const value = parseEther(elements.depositAmount.value.trim());
    if (value <= 0n) throw new Error("จำนวนฝากต้องมากกว่า 0 ETH");
    const succeeded = await sendTransaction(
      () => getBank().deposit({ value }),
      "ฝาก ETH สำเร็จ",
    );
    if (succeeded) elements.depositForm.reset();
  } catch (error) {
    setStatus(error.message || "กรุณาตรวจสอบจำนวน ETH", "error");
  }
});

elements.withdrawForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    requireReady();
    const amount = parseEther(elements.withdrawAmount.value.trim());
    if (amount <= 0n) throw new Error("จำนวนถอนต้องมากกว่า 0 ETH");
    const currentBalance = await getBank().checkBalance();
    if (amount > currentBalance) throw new Error("ยอดเงินในสัญญาไม่เพียงพอ");
    const succeeded = await sendTransaction(
      () => getBank().withdraw(amount),
      "ถอน ETH สำเร็จ",
    );
    if (succeeded) elements.withdrawForm.reset();
  } catch (error) {
    setStatus(error.shortMessage || error.reason || error.message || "กรุณาตรวจสอบจำนวน ETH", "error");
  }
});

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => {
    readWalletState().catch((error) => setStatus(error.message, "error"));
  });
  window.ethereum.on("chainChanged", () => window.location.reload());
  readWalletState().catch((error) => setStatus(error.message, "error"));
} else {
  setStatus("ไม่พบ MetaMask: สามารถอ่านหน้าเว็บได้ แต่ต้องติดตั้ง MetaMask เพื่อฝากหรือถอน ETH", "error");
}

if (window.location.protocol === "file:") {
  setStatus("เปิดหน้านี้ผ่าน file:// อยู่ — ให้เปิดผ่าน localhost หรือ GitHub Pages ก่อนเชื่อม MetaMask", "error");
} else if (!window.ethereum) {
  setStatus("ไม่พบ MetaMask ในเบราว์เซอร์นี้ กรุณาเปิดส่วนขยาย MetaMask แล้วโหลดหน้าใหม่", "error");
} else if (!isContractConfigured()) {
  setStatus("ตั้งค่า contract address ใน app.js หลัง deploy Bank.sol บน Sepolia", "info");
}
