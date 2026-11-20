<div align="center">

# Sepolia Bank · Week 7

ทดลองฝาก ถอน และตรวจยอดกับ Smart Contract บน Ethereum Sepolia  
**นายจริยธรรม มาสงค์ · รหัสนักศึกษา 66092559**

[เปิด Bank DApp](https://jareyatham-mas.github.io/sepolia-bank-week7/) · [ดูสัญญาบน Etherscan](https://sepolia.etherscan.io/address/0xd7C4B883481c901A7a61004391e92971f4B20843)

</div>

## วิธีใช้งาน

1. เปิดเว็บด้วยเบราว์เซอร์ที่มี MetaMask แล้วเลือก **Sepolia** และกด **เชื่อมต่อ MetaMask**
2. กด **ตรวจยอดเงิน** เพื่อดูยอดฝากของบัญชีที่เชื่อมต่อ ค่าเริ่มต้นใช้ MetaMask สำหรับอ่านยอด
3. หากต้องการอ่านยอดผ่าน **Infura** ให้เปิด **ช่องทางอ่านยอด** ใส่ API key หรือ Sepolia HTTPS endpoint ของ Infura แล้วกด **เชื่อม Infura** ค่านี้อยู่ในหน่วยความจำของหน้าและหายเมื่อโหลดหน้าใหม่
4. กรอกจำนวน ETH ที่ต้องการฝากหรือถอน แล้วตรวจและยืนยันธุรกรรมใน MetaMask หลังธุรกรรมได้รับการยืนยัน หน้าเว็บจะอ่านยอดใหม่และแสดงลิงก์ Etherscan
5. สลับภาษาไทยและอังกฤษ หรือธีมสว่างและมืดได้จากมุมขวาบน

## Smart Contract

| รายการ | รายละเอียด |
| --- | --- |
| เครือข่าย | Ethereum Sepolia (`11155111`) |
| ที่อยู่ | [`0xd7C4B883481c901A7a61004391e92971f4B20843`](https://sepolia.etherscan.io/address/0xd7C4B883481c901A7a61004391e92971f4B20843) |
| ธุรกรรมสร้างสัญญา | [Sepolia Etherscan](https://sepolia.etherscan.io/tx/0xad75f0d26f5ab5c8078f909dd1e9a74d631a9e11173593999903005c99415f00) |
| ซอร์ส Solidity | [contracts/Bank.sol](contracts/Bank.sol) |
| ABI | [src/contract/Bank.abi.json](src/contract/Bank.abi.json) |

Infura ใช้เฉพาะคำขออ่านยอด `eth_call` โดยส่งที่อยู่บัญชีเป็น `from` ให้ตรงกับ `msg.sender` ในสัญญา ส่วน `deposit()` และ `withdraw(uint256)` ส่งผ่าน MetaMask บน Sepolia

## เปิดบนเครื่อง

ใช้ Node.js 24 ตามเวอร์ชันใน GitHub Actions

```sh
npm ci
npm run dev
```

`npm run build` สร้างเว็บไซต์ใน `dist/` ที่ GitHub Actions ใช้เผยแพร่ไปยัง GitHub Pages

## โครงสร้าง

- `src/` หน้าเว็บ สไตล์ และการเชื่อมต่อ MetaMask / Infura
- `contracts/` ซอร์สสัญญา Bank
- `.github/workflows/` ขั้นตอน build และ deploy บน GitHub Pages
- `vite.config.js` การตั้งค่า Vite สำหรับเผยแพร่ใต้ path ของ repository

อ้างอิงแนวทางจัดโครงสร้างจาก [Sepolia Bank | Infura](https://github.com/Rittiporn12/sepolia-bank-infura)
