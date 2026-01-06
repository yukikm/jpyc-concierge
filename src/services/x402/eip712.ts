// EIP-712署名用のTypedData生成ヘルパー
import type {
  TransferAuthParams,
  TransferWithAuthorizationTypedData,
} from "./types";
import { JPYC_ADDRESS, CHAIN_ID } from "@/services/defi/constants";

// JPYC Token情報（EIP-712 domain用）
// FiatTokenV1実装コントラクトのVERSIONは"1"
const JPYC_NAME = "JPY Coin";
const JPYC_VERSION = "1";

/**
 * TransferWithAuthorization用のEIP-712 TypedDataを生成
 */
export function buildTransferAuthorizationTypedData(
  params: TransferAuthParams
): TransferWithAuthorizationTypedData {
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    domain: {
      name: JPYC_NAME,
      version: JPYC_VERSION,
      chainId: CHAIN_ID,
      verifyingContract: JPYC_ADDRESS,
    },
    message: {
      from: params.from,
      to: params.to,
      value: params.value.toString(),
      validAfter: params.validAfter.toString(),
      validBefore: params.validBefore.toString(),
      nonce: params.nonce,
    },
  };
}

/**
 * ランダムなnonce（bytes32）を生成
 */
export function generateNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

/**
 * 有効期限を計算（現在時刻 + 指定分）
 */
export function calculateValidBefore(minutesFromNow: number = 30): bigint {
  const now = Math.floor(Date.now() / 1000);
  return BigInt(now + minutesFromNow * 60);
}

/**
 * 署名を分解（v, r, s）
 */
export function splitSignature(signature: `0x${string}`): {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
} {
  // 署名は65バイト: r (32) + s (32) + v (1)
  const sig = signature.slice(2); // 0xを除去
  const r = `0x${sig.slice(0, 64)}` as `0x${string}`;
  const s = `0x${sig.slice(64, 128)}` as `0x${string}`;
  let v = parseInt(sig.slice(128, 130), 16);

  // EIP-155対応
  if (v < 27) {
    v += 27;
  }

  return { v, r, s };
}
