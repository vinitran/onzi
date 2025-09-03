/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ponz_vault.json`.
 */
export type PonzVault = {
	address: "ponzDgxsuynKG8FcHU9xGygwHd9jj2c8ZjfdgxgdLHs"
	metadata: {
		name: "ponzVault"
		version: "0.1.0"
		spec: "0.1.0"
		description: "Ponz Vault program created with Anchor"
	}
	instructions: [
		{
			name: "acceptUpdatePonzMultiSigWallet"
			discriminator: [212, 11, 164, 34, 156, 149, 201, 181]
			accounts: [
				{
					name: "master"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [109, 97, 115, 116, 101, 114]
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
			name: "createTokenPool"
			discriminator: [23, 169, 27, 122, 147, 169, 209, 152]
			accounts: [
				{
					name: "mint"
					writable: true
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
			name: "initMaster"
			discriminator: [168, 49, 22, 248, 228, 56, 111, 24]
			accounts: [
				{
					name: "master"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [109, 97, 115, 116, 101, 114]
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
					name: "ponzVaultProgram"
					address: "ponzDgxsuynKG8FcHU9xGygwHd9jj2c8ZjfdgxgdLHs"
				},
				{
					name: "ponzVaultProgramData"
				}
			]
			args: [
				{
					name: "param"
					type: {
						defined: {
							name: "initMasterParam"
						}
					}
				}
			]
		},
		{
			name: "initSolPool"
			discriminator: [101, 7, 214, 154, 142, 207, 92, 111]
			accounts: [
				{
					name: "master"
					pda: {
						seeds: [
							{
								kind: "const"
								value: [109, 97, 115, 116, 101, 114]
							}
						]
					}
				},
				{
					name: "solPool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [115, 111, 108, 95, 112, 111, 111, 108]
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
			name: "initUpdatePonzMultiSigWallet"
			discriminator: [190, 164, 142, 233, 106, 119, 247, 181]
			accounts: [
				{
					name: "master"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [109, 97, 115, 116, 101, 114]
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
			name: "withdrawSol"
			discriminator: [145, 131, 74, 136, 65, 137, 42, 38]
			accounts: [
				{
					name: "master"
				},
				{
					name: "withdrawer"
					writable: true
					signer: true
				},
				{
					name: "solPool"
					writable: true
					pda: {
						seeds: [
							{
								kind: "const"
								value: [115, 111, 108, 95, 112, 111, 111, 108]
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
			name: "master"
			discriminator: [168, 213, 193, 12, 77, 162, 58, 235]
		},
		{
			name: "solPool"
			discriminator: [186, 223, 129, 62, 246, 174, 145, 175]
		}
	]
	events: [
		{
			name: "createTokenPoolEvent"
			discriminator: [24, 87, 56, 15, 240, 198, 223, 144]
		},
		{
			name: "withdrawSolPoolEvent"
			discriminator: [12, 167, 195, 107, 209, 2, 83, 24]
		}
	]
	errors: [
		{
			code: 6000
			name: "invalidPonzVaultProgram"
			msg: "Invalid Ponz Vault program"
		},
		{
			code: 6001
			name: "invalidPonzVaultProgramData"
			msg: "Invalid Ponz Vault program data"
		},
		{
			code: 6002
			name: "notPonzMultiSigWallet"
			msg: "You are not the Ponz Multi Sig wallet"
		},
		{
			code: 6003
			name: "notPendingPonzMultiSigWallet"
			msg: "You are not the Pending Ponz Multi Sig wallet"
		},
		{
			code: 6004
			name: "emptyWallet"
			msg: "Empty wallet"
		}
	]
	types: [
		{
			name: "createTokenPoolEvent"
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
			name: "initMasterParam"
			type: {
				kind: "struct"
				fields: [
					{
						name: "ponzMultiSigWallet"
						type: "pubkey"
					}
				]
			}
		},
		{
			name: "master"
			type: {
				kind: "struct"
				fields: [
					{
						name: "ponzMultiSigWallet"
						type: "pubkey"
					},
					{
						name: "pendingPonzMultiSigWallet"
						type: {
							option: "pubkey"
						}
					},
					{
						name: "bump"
						type: "u8"
					}
				]
			}
		},
		{
			name: "solPool"
			type: {
				kind: "struct"
				fields: [
					{
						name: "id"
						type: "u8"
					}
				]
			}
		},
		{
			name: "withdrawSolPoolEvent"
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
