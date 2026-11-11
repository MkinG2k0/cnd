import { existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const androidDir = path.join(root, "android");
const keystorePath = path.join(androidDir, "cnd-upload.keystore");
const propsPath = path.join(androidDir, "keystore.properties");

const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD || "cndupload";
const keyPassword = process.env.ANDROID_KEY_PASSWORD || storePassword;
const keyAlias = process.env.ANDROID_KEY_ALIAS || "cnd";

if (existsSync(keystorePath)) {
  console.log(`Keystore already exists: ${keystorePath}`);
} else {
  const dname = "CN=CND,OU=Mobile,O=CND,L=Makhachkala,ST=Dagestan,C=RU";
  const args = [
    "-genkeypair",
    "-v",
    "-keystore",
    `"${keystorePath}"`,
    "-alias",
    keyAlias,
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-storepass",
    storePassword,
    "-keypass",
    keyPassword,
    "-dname",
    `"${dname}"`,
  ];
  const result = spawnSync(`keytool ${args.join(" ")}`, {
    stdio: "inherit",
    shell: true,
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(propsPath)) {
  writeFileSync(
    propsPath,
    [
      "storeFile=cnd-upload.keystore",
      `storePassword=${storePassword}`,
      `keyAlias=${keyAlias}`,
      `keyPassword=${keyPassword}`,
      "",
    ].join("\n"),
    "utf8",
  );
  console.log(`Wrote ${propsPath}`);
} else {
  console.log(`Properties already exist: ${propsPath}`);
}

console.log("Release signing is ready. Keep keystore + keystore.properties private.");
