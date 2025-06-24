/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ponz.json`.
 */
export type PonzSc = {
	address: "ponzDBbYFNQ7D2qzeJg5MjdwYZFgp6uJhT7VHLMAxpv"
	metadata: {
		name: "ponz"
		version: "0.1.0"
		spec: "0.1.0"
		description: "Ponz platform program"
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
			name: "acceptUpdatePonzMultiSigWallet"
			discriminator: [212, 11, 164, 34, 156, 149, 201, 181]
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
			name: "acceptUpdatePonzTokenMintAuthorityWallet"
			discriminator: [123, 126, 95, 10, 16, 33, 164, 64]
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
			name: "buyLock"
			discriminator: [112, 223, 72, 179, 160, 80, 43, 53]
			accounts: [
				{
					name: "payer"
					writable: true
					signer: true
				},
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
					name: "tokenPoolLock"
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
									116,
									111,
									107,
									101,
									110,
									95,
									112,
									111,
									111,
									108,
									95,
									108,
									111,
									99,
									107
								]
							}
						]
					}
				},
				{
					name: "payerAta"
					writable: true
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
				},
				{
					name: "lockPercent"
					type: "f64"
				},
				{
					name: "lockTime"
					type: "i64"
				}
			]
		},
		{
			name: "createToken"
			discriminator: [84, 52, 204, 228, 24, 140, 234, 75]
			accounts: [
				{
					name: "payer"
					writable: true
					signer: true
				},
				{
					name: "mint"
					writable: true
					signer: true
				},
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
							path: "ponzVault"
						}
					}
				},
				{
					name: "ponzTokenMintAuthorityWallet"
				},
				{
					name: "withheldAuthority"
				},
				{
					name: "ponzVault"
					address: "ponzfzUKxc1MGndnnCNX8GZKpW7BUQrRDenK4JDcgFG"
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
				},
				{
					name: "ponzProgram"
					address: "ponzXJ4pkXY4KwhxfTT4onNfCDURtRTt2EuShiAiBnf"
				},
				{
					name: "ponzProgramData"
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
			name: "initUpdatePonzMultiSigWallet"
			discriminator: [190, 164, 142, 233, 106, 119, 247, 181]
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
					name: "newPonzMultiSigWallet"
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
			name: "initUpdatePonzTokenMintAuthorityWallet"
			discriminator: [197, 159, 135, 65, 255, 237, 193, 27]
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
					name: "newPonzTokenMintAuthorityWallet"
					type: "pubkey"
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
					name: "associatedTokenProgram"
					address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
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
			name: "updateConfiguration"
			discriminator: [156, 68, 173, 185, 72, 133, 242, 232]
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
							name: "updateConfigurationParam"
						}
					}
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
			name: "withdrawTokenPoolLock"
			discriminator: [100, 245, 110, 226, 8, 144, 132, 95]
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
					name: "tokenPoolLock"
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
									116,
									111,
									107,
									101,
									110,
									95,
									112,
									111,
									111,
									108,
									95,
									108,
									111,
									99,
									107
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
			args: []
		}
	]
	accounts: [
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
			name: "removeLiquidityEvent"
			discriminator: [141, 199, 182, 123, 159, 94, 215, 102]
		},
		{
			name: "sellEvent"
			discriminator: [62, 47, 55, 10, 165, 3, 220, 42]
		},
		{
			name: "withdrawFeePoolEvent"
			discriminator: [20, 253, 195, 73, 93, 232, 177, 171]
		},
		{
			name: "withdrawTokenPoolLockEvent"
			discriminator: [54, 107, 94, 60, 170, 21, 71, 230]
		}
	]
	errors: [
		{
			code: 6000
			name: "invalidPonzProgram"
			msg: "Invalid Ponz program"
		},
		{
			code: 6001
			name: "invalidPonzProgramData"
			msg: "Invalid Ponz program data"
		},
		{
			code: 6002
			name: "missMatchingValue"
			msg: "Mismatching Values"
		},
		{
			code: 6003
			name: "slippageExcceded"
			msg: "Slippage Error"
		},
		{
			code: 6004
			name: "bondingCurveCompleted"
			msg: "Bonding Curve completed"
		},
		{
			code: 6005
			name: "bondingCurveIsNotCompleted"
			msg: "Bonding Curve is not completed"
		},
		{
			code: 6006
			name: "insufficientLiquidityToWithdraw"
			msg: "No liquidity to withdraw"
		},
		{
			code: 6007
			name: "insufficientPoolFeeToWithdraw"
			msg: "No pool fee to withdraw"
		},
		{
			code: 6008
			name: "notOwnerWallet"
			msg: "Not the Owner Wallet"
		},
		{
			code: 6009
			name: "notPonzSystemWallet"
			msg: "Not the Ponz System Wallet"
		},
		{
			code: 6010
			name: "notPonzTokenMintAuthorityWallet"
			msg: "Not the Ponz Token Mint Authority Wallet"
		},
		{
			code: 6011
			name: "notPonzMultiSigWallet"
			msg: "Not the Ponz Multi Sig Wallet"
		},
		{
			code: 6012
			name: "notPendingOwnerWallet"
			msg: "Not the Pending Owner Wallet"
		},
		{
			code: 6013
			name: "notPendingPonzSystemWallet"
			msg: "Not the Pending Ponz System Wallet"
		},
		{
			code: 6014
			name: "notPendingPonzTokenMintAuthorityWallet"
			msg: "Not the Pending Ponz Mint Authority Wallet"
		},
		{
			code: 6015
			name: "notPendingPonzMultiSigWallet"
			msg: "Not the Pending Ponz Multi Sig Wallet"
		},
		{
			code: 6016
			name: "emptyWallet"
			msg: "Empty wallet"
		},
		{
			code: 6017
			name: "unAuthorized"
			msg: "You are not the Ponz SYSTEM Wallet or Ponz OWNER Wallet"
		},
		{
			code: 6018
			name: "invalidSwapFee"
			msg: "Invalid swap fee"
		},
		{
			code: 6019
			name: "tokenPoolLockNotExpired"
			msg: "Token pool lock not expired"
		},
		{
			code: 6020
			name: "zeroLamportsInputAmount"
			msg: "Zero lamports input amount"
		},
		{
			code: 6021
			name: "zeroTokenInputAmount"
			msg: "Zero token input amount"
		},
		{
			code: 6022
			name: "mathOverflow"
			msg: "Math Overflow"
		},
		{
			code: 6023
			name: "invalidLockTime"
			msg: "Invalid Lock Time"
		},
		{
			code: 6024
			name: "invalidLockPercent"
			msg: "Invalid Lock Percent"
		},
		{
			code: 6025
			name: "invalidTokenPoolData"
			msg: "Invalid Token Pool Owner"
		}
	]
	types: [
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
						name: "complete"
						type: "bool"
					},
					{
						name: "unlockTime"
						type: "i64"
					},
					{
						name: "prevPrice"
						type: "f64"
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
						name: "netAmount"
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
						name: "creator"
						type: "pubkey"
					},
					{
						name: "mint"
						type: "pubkey"
					},
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
			name: "initializeConfiguration"
			type: {
				kind: "struct"
				fields: [
					{
						name: "bump"
						type: "u8"
					},
					{
						name: "swapFee"
						type: "f32"
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
						name: "ownerWallet"
						type: "pubkey"
					},
					{
						name: "pendingOwner"
						type: {
							option: "pubkey"
						}
					},
					{
						name: "ponzSystemWallet"
						type: "pubkey"
					},
					{
						name: "pendingPonzSystemWallet"
						type: {
							option: "pubkey"
						}
					},
					{
						name: "ponzTokenMintAuthorityWallet"
						type: "pubkey"
					},
					{
						name: "pendingPonzTokenMintAuthorityWallet"
						type: {
							option: "pubkey"
						}
					},
					{
						name: "ponzMultiSigWallet"
						type: "pubkey"
					},
					{
						name: "pendingPonzMultiSigWallet"
						type: {
							option: "pubkey"
						}
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
						name: "swapFee"
						type: "f32"
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
						name: "ownerWallet"
						type: "pubkey"
					},
					{
						name: "ponzSystemWallet"
						type: "pubkey"
					},
					{
						name: "ponzTokenMintAuthorityWallet"
						type: "pubkey"
					},
					{
						name: "ponzMultiSigWallet"
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
						name: "netAmount"
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
			name: "updateConfigurationParam"
			type: {
				kind: "struct"
				fields: [
					{
						name: "swapFee"
						type: "f32"
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
			name: "withdrawTokenPoolLockEvent"
			type: {
				kind: "struct"
				fields: [
					{
						name: "withdrawer"
						type: "pubkey"
					},
					{
						name: "mint"
						type: "pubkey"
					},
					{
						name: "amount"
						type: "u64"
					}
				]
			}
		}
	]
}
