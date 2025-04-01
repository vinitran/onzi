/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ponz_sc.json`.
 */
export type PonzSc = {
	address: "CnZwQbRAwQRK6XXojJ9B1VMkeaFP7ekEkNPH2Ctqg3S6"
	metadata: {
		name: "ponzSc"
		version: "0.1.0"
		spec: "0.1.0"
		description: "Created with Anchor"
	}
	instructions: [
		{
			name: "acceptUpdateOwnerWallet"
			discriminator: [61, 36, 100, 184, 133, 247, 21, 145]
			accounts: [
				{
					name: "globalConfiguration"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "signer"
					writable: true
					signer: true
				}
			]
			args: []
		},
		{
			name: "acceptUpdatePonzRewardSystemWallet"
			discriminator: [230, 134, 87, 153, 128, 158, 142, 15]
			accounts: [
				{
					name: "globalConfiguration"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "signer"
					writable: true
					signer: true
				}
			]
			args: []
		},
		{
			name: "acceptUpdatePonzSystemWallet"
			discriminator: [33, 179, 65, 71, 77, 99, 44, 19]
			accounts: [
				{
					name: "globalConfiguration"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "signer"
					writable: true
					signer: true
				}
			]
			args: []
		},
		{
			name: "buy"
			discriminator: [102, 6, 61, 18, 1, 218, 235, 234]
			accounts: [
				{
					name: "globalConfiguration"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "mint"
				},
				{
					name: "bondingCurve"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [
									98,
									111,
									110,
									100,
									105,
									110,
									103,
									95,
									99,
									117,
									114,
									118,
									101
								]
							}
						]
					}
				},
				{
					name: "payerAta"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "payer"
							},
							{
								kind: "account"
								path: "tokenProgram"
							},
							{
								kind: "account"
								path: "mint"
							}
						]
						program: {
							kind: "const"
							value: [
								140,
								151,
								37,
								143,
								78,
								36,
								137,
								241,
								187,
								61,
								16,
								41,
								20,
								142,
								13,
								131,
								11,
								90,
								19,
								153,
								218,
								255,
								16,
								132,
								4,
								142,
								123,
								216,
								219,
								233,
								248,
								89
							]
						}
					}
				},
				{
					name: "tokenPool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [116, 111, 107, 101, 110, 95, 112, 111, 111, 108]
							}
						]
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "associatedTokenProgram"
					address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
				},
				{
					name: "tokenProgram"
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: [
				{
					name: "solInAmt"
					type: "u64"
				},
				{
					name: "expectedTokenAmt"
					type: "u64"
				}
			]
		},
		{
			name: "createPool"
			discriminator: [233, 146, 209, 142, 207, 104, 64, 188]
			accounts: [
				{
					name: "globalConfiguration"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "mint"
					writable: true
				},
				{
					name: "bondingCurve"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [
									98,
									111,
									110,
									100,
									105,
									110,
									103,
									95,
									99,
									117,
									114,
									118,
									101
								]
							}
						]
					}
				},
				{
					name: "tokenPool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [116, 111, 107, 101, 110, 95, 112, 111, 111, 108]
							}
						]
					}
				},
				{
					name: "psrvTokenPool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [116, 111, 107, 101, 110, 95, 112, 111, 111, 108]
							}
						]
						program: {
							kind: "account"
							path: "ponzScRewardVault"
						}
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "ponzScRewardVault"
					address: "4ViYgYEQwm2h8B41RjkvhLaBqFgqgSFCbTjK1uMtuYbP"
				},
				{
					name: "tokenProgram"
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: []
		},
		{
			name: "createToken"
			discriminator: [84, 52, 204, 228, 24, 140, 234, 75]
			accounts: [
				{
					name: "globalConfiguration"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "mint"
					writable: true
					signer: true
				},
				{
					name: "bondingCurve"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [
									98,
									111,
									110,
									100,
									105,
									110,
									103,
									95,
									99,
									117,
									114,
									118,
									101
								]
							}
						]
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "ponzRewardSystemWallet"
				},
				{
					name: "tokenProgram"
					address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				},
				{
					name: "associatedTokenProgram"
					address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
				},
				{
					name: "rent"
					address: "SysvarRent111111111111111111111111111111111"
				}
			]
			args: [
				{
					name: "args"
					type: {
						defined: {
							name: "tokenMetadataArgs"
						}
					}
				}
			]
		},
		{
			name: "harvest"
			discriminator: [228, 241, 31, 182, 53, 169, 59, 199]
			accounts: [
				{
					name: "mintAccount"
					writable: true
				},
				{
					name: "tokenProgram"
					address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
				}
			]
			args: []
		},
		{
			name: "initConfiguration"
			discriminator: [81, 72, 29, 124, 124, 240, 7, 159]
			accounts: [
				{
					name: "globalConfiguration"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: [
				{
					name: "param"
					type: {
						defined: {
							name: "initializeConfigurationParam"
						}
					}
				}
			]
		},
		{
			name: "initFeePool"
			discriminator: [137, 153, 38, 145, 29, 186, 164, 182]
			accounts: [
				{
					name: "globalConfiguration"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "feePool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [102, 101, 101, 95, 112, 111, 111, 108]
							}
						]
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: []
		},
		{
			name: "initPremiumFeePool"
			discriminator: [76, 96, 123, 69, 6, 114, 144, 17]
			accounts: [
				{
					name: "globalConfiguration"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "premiumFeePool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									112,
									114,
									101,
									109,
									105,
									117,
									109,
									95,
									102,
									101,
									101,
									95,
									112,
									111,
									111,
									108
								]
							}
						]
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: []
		},
		{
			name: "initUpdateOwnerWallet"
			discriminator: [66, 215, 192, 92, 46, 196, 161, 115]
			accounts: [
				{
					name: "globalConfiguration"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "signer"
					writable: true
					signer: true
				}
			]
			args: [
				{
					name: "newOwner"
					type: "pubkey"
				}
			]
		},
		{
			name: "initUpdatePonzRewardSystemWallet"
			discriminator: [179, 67, 164, 24, 253, 82, 17, 206]
			accounts: [
				{
					name: "globalConfiguration"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "signer"
					writable: true
					signer: true
				}
			]
			args: [
				{
					name: "newPonzRewardSystemWallet"
					type: "pubkey"
				}
			]
		},
		{
			name: "initUpdatePonzSystemWallet"
			discriminator: [163, 31, 74, 77, 111, 138, 93, 216]
			accounts: [
				{
					name: "globalConfiguration"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "signer"
					writable: true
					signer: true
				}
			]
			args: [
				{
					name: "newPonzSystemWallet"
					type: "pubkey"
				}
			]
		},
		{
			name: "proxyInitialize"
			discriminator: [185, 41, 170, 16, 237, 245, 76, 134]
			accounts: [
				{
					name: "cpSwapProgram"
					address: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"
				},
				{
					name: "creator"
					docs: ["Address paying to create the pool. Can be anyone"]
					writable: true
					signer: true
				},
				{
					name: "ammConfig"
					docs: ["Which config the pool belongs to."]
				},
				{
					name: "authority"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									118,
									97,
									117,
									108,
									116,
									95,
									97,
									110,
									100,
									95,
									108,
									112,
									95,
									109,
									105,
									110,
									116,
									95,
									97,
									117,
									116,
									104,
									95,
									115,
									101,
									101,
									100
								]
							}
						]
						program: {
							kind: "account"
							path: "cpSwapProgram"
						}
					}
				},
				{
					name: "poolState"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [112, 111, 111, 108]
							},
							{
								kind: "account"
								path: "ammConfig"
							},
							{
								kind: "account"
								path: "token0Mint"
							},
							{
								kind: "account"
								path: "token1Mint"
							}
						]
						program: {
							kind: "account"
							path: "cpSwapProgram"
						}
					}
				},
				{
					name: "token0Mint"
					docs: ["Token_0 mint, the key must smaller then token_1 mint."]
				},
				{
					name: "token1Mint"
					docs: ["Token_1 mint, the key must grater then token_0 mint."]
				},
				{
					name: "lpMint"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									112,
									111,
									111,
									108,
									95,
									108,
									112,
									95,
									109,
									105,
									110,
									116
								]
							},
							{
								kind: "account"
								path: "poolState"
							}
						]
						program: {
							kind: "account"
							path: "cpSwapProgram"
						}
					}
				},
				{
					name: "creatorToken0"
					docs: ["payer token0 account"]
					writable: true
				},
				{
					name: "creatorToken1"
					docs: ["creator token1 account"]
					writable: true
				},
				{
					name: "creatorLpToken"
					writable: true
				},
				{
					name: "token0Vault"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [112, 111, 111, 108, 95, 118, 97, 117, 108, 116]
							},
							{
								kind: "account"
								path: "poolState"
							},
							{
								kind: "account"
								path: "token0Mint"
							}
						]
						program: {
							kind: "account"
							path: "cpSwapProgram"
						}
					}
				},
				{
					name: "token1Vault"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [112, 111, 111, 108, 95, 118, 97, 117, 108, 116]
							},
							{
								kind: "account"
								path: "poolState"
							},
							{
								kind: "account"
								path: "token1Mint"
							}
						]
						program: {
							kind: "account"
							path: "cpSwapProgram"
						}
					}
				},
				{
					name: "createPoolFee"
					docs: ["create pool fee account"]
					writable: true
					address: "DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8"
				},
				{
					name: "observationState"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [111, 98, 115, 101, 114, 118, 97, 116, 105, 111, 110]
							},
							{
								kind: "account"
								path: "poolState"
							}
						]
						program: {
							kind: "account"
							path: "cpSwapProgram"
						}
					}
				},
				{
					name: "tokenProgram"
					docs: ["Program to create mint account and mint tokens"]
					address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
				},
				{
					name: "token0Program"
					docs: ["Spl token program or token program 2022"]
				},
				{
					name: "token1Program"
					docs: ["Spl token program or token program 2022"]
				},
				{
					name: "associatedTokenProgram"
					docs: ["Program to create an ATA for receiving position NFT"]
					address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
				},
				{
					name: "systemProgram"
					docs: ["To create a new program account"]
					address: "11111111111111111111111111111111"
				},
				{
					name: "rent"
					docs: ["Sysvar for program account"]
					address: "SysvarRent111111111111111111111111111111111"
				}
			]
			args: [
				{
					name: "initAmount0"
					type: "u64"
				},
				{
					name: "initAmount1"
					type: "u64"
				},
				{
					name: "openTime"
					type: "u64"
				}
			]
		},
		{
			name: "removeLiquidity"
			discriminator: [80, 85, 209, 72, 24, 206, 177, 108]
			accounts: [
				{
					name: "globalConfiguration"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "mint"
				},
				{
					name: "bondingCurve"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [
									98,
									111,
									110,
									100,
									105,
									110,
									103,
									95,
									99,
									117,
									114,
									118,
									101
								]
							}
						]
					}
				},
				{
					name: "tokenPool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [116, 111, 107, 101, 110, 95, 112, 111, 111, 108]
							}
						]
					}
				},
				{
					name: "payerAta"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "payer"
							},
							{
								kind: "account"
								path: "tokenProgram"
							},
							{
								kind: "account"
								path: "mint"
							}
						]
						program: {
							kind: "const"
							value: [
								140,
								151,
								37,
								143,
								78,
								36,
								137,
								241,
								187,
								61,
								16,
								41,
								20,
								142,
								13,
								131,
								11,
								90,
								19,
								153,
								218,
								255,
								16,
								132,
								4,
								142,
								123,
								216,
								219,
								233,
								248,
								89
							]
						}
					}
				},
				{
					name: "tokenProgram"
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: []
		},
		{
			name: "sell"
			discriminator: [51, 230, 133, 164, 1, 127, 131, 173]
			accounts: [
				{
					name: "globalConfiguration"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "bondingCurve"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [
									98,
									111,
									110,
									100,
									105,
									110,
									103,
									95,
									99,
									117,
									114,
									118,
									101
								]
							}
						]
					}
				},
				{
					name: "mint"
				},
				{
					name: "payerAta"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "payer"
							},
							{
								kind: "account"
								path: "tokenProgram"
							},
							{
								kind: "account"
								path: "mint"
							}
						]
						program: {
							kind: "const"
							value: [
								140,
								151,
								37,
								143,
								78,
								36,
								137,
								241,
								187,
								61,
								16,
								41,
								20,
								142,
								13,
								131,
								11,
								90,
								19,
								153,
								218,
								255,
								16,
								132,
								4,
								142,
								123,
								216,
								219,
								233,
								248,
								89
							]
						}
					}
				},
				{
					name: "tokenPool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "account"
								path: "mint"
							},
							{
								kind: "const"
								value: [116, 111, 107, 101, 110, 95, 112, 111, 111, 108]
							}
						]
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "associatedTokenProgram"
					address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
				},
				{
					name: "tokenProgram"
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: [
				{
					name: "tokenInAmt"
					type: "u64"
				},
				{
					name: "expectedSolAmt"
					type: "u64"
				}
			]
		},
		{
			name: "subscribePremium"
			discriminator: [204, 229, 74, 94, 119, 139, 183, 13]
			accounts: [
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "premiumFeePool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									112,
									114,
									101,
									109,
									105,
									117,
									109,
									95,
									102,
									101,
									101,
									95,
									112,
									111,
									111,
									108
								]
							}
						]
					}
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: [
				{
					name: "amount"
					type: "u64"
				}
			]
		},
		{
			name: "withdrawFeePool"
			discriminator: [68, 245, 107, 235, 201, 200, 81, 204]
			accounts: [
				{
					name: "globalConfiguration"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "feePool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [102, 101, 101, 95, 112, 111, 111, 108]
							}
						]
					}
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: []
		},
		{
			name: "withdrawPremiumFee"
			discriminator: [131, 21, 247, 96, 87, 15, 23, 179]
			accounts: [
				{
					name: "globalConfiguration"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									103,
									108,
									111,
									98,
									97,
									108,
									95,
									99,
									111,
									110,
									102,
									105,
									103
								]
							}
						]
					}
				},
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "premiumFeePool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [
									112,
									114,
									101,
									109,
									105,
									117,
									109,
									95,
									102,
									101,
									101,
									95,
									112,
									111,
									111,
									108
								]
							}
						]
					}
				},
				{
					name: "systemProgram"
					address: "11111111111111111111111111111111"
				}
			]
			args: []
		}
	]
	accounts: [
		{
			name: "ammConfig"
			discriminator: [218, 244, 33, 104, 203, 203, 43, 111]
		},
		{
			name: "bondingCurve"
			discriminator: [23, 183, 248, 55, 96, 216, 172, 96]
		},
		{
			name: "feePool"
			discriminator: [172, 38, 77, 146, 148, 5, 51, 242]
		},
		{
			name: "initializeConfiguration"
			discriminator: [100, 69, 154, 202, 176, 44, 253, 185]
		},
		{
			name: "premiumFeePool"
			discriminator: [79, 96, 15, 231, 101, 8, 92, 125]
		}
	]
	events: [
		{
			name: "bondingCurveCompletedEvent"
			discriminator: [205, 73, 79, 25, 189, 236, 231, 31]
		},
		{
			name: "buyEvent"
			discriminator: [103, 244, 82, 31, 44, 245, 119, 119]
		},
		{
			name: "createPoolEvent"
			discriminator: [177, 49, 12, 210, 160, 118, 167, 116]
		},
		{
			name: "createTokenEvent"
			discriminator: [4, 4, 86, 151, 191, 94, 245, 193]
		},
		{
			name: "initConfigurationEvent"
			discriminator: [79, 206, 51, 242, 171, 132, 87, 224]
		},
		{
			name: "proxyInitializeEvent"
			discriminator: [196, 109, 230, 68, 63, 121, 100, 202]
		},
		{
			name: "removeLiquidityEvent"
			discriminator: [141, 199, 182, 123, 159, 94, 215, 102]
		},
		{
			name: "sellEvent"
			discriminator: [62, 47, 55, 10, 165, 3, 220, 42]
		},
		{
			name: "subscribePremiumEvent"
			discriminator: [12, 254, 132, 21, 62, 222, 215, 212]
		},
		{
			name: "withdrawFeePoolEvent"
			discriminator: [20, 253, 195, 73, 93, 232, 177, 171]
		},
		{
			name: "withdrawPremiumFeeEvent"
			discriminator: [230, 124, 52, 224, 148, 243, 108, 13]
		}
	]
	errors: [
		{
			code: 6000
			name: "missMatchingValue"
			msg: "Mismatching Values"
		},
		{
			code: 6001
			name: "slippageExcceded"
			msg: "Slippage Error"
		},
		{
			code: 6002
			name: "insufficientPremiumFeeToWithdraw"
			msg: "No premium fee to withdraw"
		},
		{
			code: 6003
			name: "insufficientPoolFeeToWithdraw"
			msg: "No pool fee to withdraw"
		},
		{
			code: 6004
			name: "notOwnerWallet"
			msg: "You are not the Owner Wallet"
		},
		{
			code: 6005
			name: "notPonzSystemWallet"
			msg: "You are not the Ponz System Wallet"
		},
		{
			code: 6006
			name: "notPonzRewardSystemWallet"
			msg: "You are not the Ponz Reward System Wallet"
		},
		{
			code: 6007
			name: "notPendingOwnerWallet"
			msg: "You are not the Pending Owner Wallet"
		},
		{
			code: 6008
			name: "notPendingPonzSystemWallet"
			msg: "You are not the Pending Ponz System Wallet"
		},
		{
			code: 6009
			name: "notPendingPonzRewardSystemWallet"
			msg: "You are not the Pending Ponz Reward System Wallet"
		},
		{
			code: 6010
			name: "emptyWallet"
			msg: "Empty wallet"
		}
	]
	types: [
		{
			name: "ammConfig"
			docs: ["Holds the current owner of the factory"]
			type: {
				kind: "struct"
				fields: [
					{
						name: "bump"
						docs: ["Bump to identify PDA"]
						type: "u8"
					},
					{
						name: "disableCreatePool"
						docs: ["Status to control if new pool can be create"]
						type: "bool"
					},
					{
						name: "index"
						docs: ["Config index"]
						type: "u16"
					},
					{
						name: "tradeFeeRate"
						docs: ["The trade fee, denominated in hundredths of a bip (10^-6)"]
						type: "u64"
					},
					{
						name: "protocolFeeRate"
						docs: ["The protocol fee"]
						type: "u64"
					},
					{
						name: "fundFeeRate"
						docs: ["The fund fee, denominated in hundredths of a bip (10^-6)"]
						type: "u64"
					},
					{
						name: "createPoolFee"
						docs: ["Fee for create a new pool"]
						type: "u64"
					},
					{
						name: "protocolOwner"
						docs: ["Address of the protocol fee owner"]
						type: "pubkey"
					},
					{
						name: "fundOwner"
						docs: ["Address of the fund fee owner"]
						type: "pubkey"
					},
					{
						name: "padding"
						docs: ["padding"]
						type: {
							array: ["u64", 16]
						}
					}
				]
			}
		},
		{
			name: "bondingCurve"
			type: {
				kind: "struct"
				fields: [
					{
						name: "creator"
						type: "pubkey"
					},
					{
						name: "bump"
						type: "u8"
					},
					{
						name: "initVirtualSol"
						type: "u64"
					},
					{
						name: "initVirtualToken"
						type: "u64"
					},
					{
						name: "tokenSupply"
						type: "u64"
					},
					{
						name: "tokenReserves"
						type: "u64"
					},
					{
						name: "solReserves"
						type: "u64"
					},
					{
						name: "kParam"
						type: "u128"
					},
					{
						name: "rewardBuyTax"
						type: "f32"
					},
					{
						name: "rewardSellTax"
						type: "f32"
					},
					{
						name: "jackpotBuyTax"
						type: "f32"
					},
					{
						name: "jackpotSellTax"
						type: "f32"
					},
					{
						name: "burnBuyTax"
						type: "f32"
					},
					{
						name: "burnSellTax"
						type: "f32"
					}
				]
			}
		},
		{
			name: "bondingCurveCompletedEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "mint"
						type: "pubkey"
					},
					{
						name: "bondingCurve"
						type: "pubkey"
					},
					{
						name: "tokenPool"
						type: "pubkey"
					}
				]
			}
		},
		{
			name: "buyEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "mint"
						type: "pubkey"
					},
					{
						name: "buyer"
						type: "pubkey"
					},
					{
						name: "amount"
						type: "u64"
					},
					{
						name: "lamports"
						type: "u64"
					},
					{
						name: "previousPrice"
						type: "f64"
					},
					{
						name: "newPrice"
						type: "f64"
					},
					{
						name: "timestamp"
						type: "i64"
					}
				]
			}
		},
		{
			name: "createPoolEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "mint"
						type: "pubkey"
					},
					{
						name: "pool"
						type: "pubkey"
					}
				]
			}
		},
		{
			name: "createTokenEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "mint"
						type: "pubkey"
					}
				]
			}
		},
		{
			name: "feePool"
			type: {
				kind: "struct"
				fields: []
			}
		},
		{
			name: "initConfigurationEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "owner"
						type: "pubkey"
					},
					{
						name: "ponzRewardSystem"
						type: "pubkey"
					}
				]
			}
		},
		{
			name: "initializeConfiguration"
			type: {
				kind: "struct"
				fields: [
					{
						name: "ownerWallet"
						type: "pubkey"
					},
					{
						name: "ponzSystemWallet"
						type: "pubkey"
					},
					{
						name: "ponzRewardSystemWallet"
						type: "pubkey"
					},
					{
						name: "pendingOwner"
						type: {
							option: "pubkey"
						}
					},
					{
						name: "pendingPonzSystemWallet"
						type: {
							option: "pubkey"
						}
					},
					{
						name: "pendingPonzRewardSystemWallet"
						type: {
							option: "pubkey"
						}
					},
					{
						name: "bump"
						type: "u8"
					},
					{
						name: "bondingCurveLimitation"
						type: "u64"
					},
					{
						name: "initialVirtualSol"
						type: "u64"
					},
					{
						name: "initialVirtualToken"
						type: "u64"
					},
					{
						name: "createPoolFeeLamports"
						type: "u64"
					}
				]
			}
		},
		{
			name: "initializeConfigurationParam"
			type: {
				kind: "struct"
				fields: [
					{
						name: "ownerWallet"
						type: "pubkey"
					},
					{
						name: "ponzSystemWallet"
						type: "pubkey"
					},
					{
						name: "ponzRewardSystemWallet"
						type: "pubkey"
					},
					{
						name: "bondingCurveLimitation"
						type: "u64"
					},
					{
						name: "initialVirtualSol"
						type: "u64"
					},
					{
						name: "initialVirtualToken"
						type: "u64"
					},
					{
						name: "createPoolFeeLamports"
						type: "u64"
					}
				]
			}
		},
		{
			name: "premiumFeePool"
			type: {
				kind: "struct"
				fields: [
					{
						name: "bump"
						type: "u8"
					}
				]
			}
		},
		{
			name: "proxyInitializeEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "poolAddress"
						type: "pubkey"
					}
				]
			}
		},
		{
			name: "removeLiquidityEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "withdrawer"
						type: "pubkey"
					},
					{
						name: "amount"
						type: "u64"
					},
					{
						name: "lamports"
						type: "u64"
					}
				]
			}
		},
		{
			name: "sellEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "seller"
						type: "pubkey"
					},
					{
						name: "mint"
						type: "pubkey"
					},
					{
						name: "amount"
						type: "u64"
					},
					{
						name: "lamports"
						type: "u64"
					},
					{
						name: "previousPrice"
						type: "f64"
					},
					{
						name: "newPrice"
						type: "f64"
					},
					{
						name: "timestamp"
						type: "i64"
					}
				]
			}
		},
		{
			name: "subscribePremiumEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "user"
						type: "pubkey"
					},
					{
						name: "amount"
						type: "u64"
					},
					{
						name: "subscriptionTime"
						type: "i64"
					}
				]
			}
		},
		{
			name: "tokenMetadataArgs"
			type: {
				kind: "struct"
				fields: [
					{
						name: "name"
						type: "string"
					},
					{
						name: "symbol"
						type: "string"
					},
					{
						name: "uri"
						type: "string"
					},
					{
						name: "transferFeeBasisPoints"
						type: "u16"
					},
					{
						name: "maximumFee"
						type: "u64"
					}
				]
			}
		},
		{
			name: "withdrawFeePoolEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "withdrawer"
						type: "pubkey"
					},
					{
						name: "lamports"
						type: "u64"
					}
				]
			}
		},
		{
			name: "withdrawPremiumFeeEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "withdrawer"
						type: "pubkey"
					},
					{
						name: "lamports"
						type: "u64"
					}
				]
			}
		}
	]
}
