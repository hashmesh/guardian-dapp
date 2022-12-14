import { useContext, useEffect, useState } from 'react';
import {
  blockExplorer,
  getShortId,
  GlobalContext,
  INITIAL_RECOVERY_INFO,
  INITIAL_VAULT_EDITS,
} from '../context/GlobalState';
import BackOrContinueBtns from './BackOrContinueBtns';
import ElementWithTitle from './ElementWithTitle';
import InfoParagraph from './InfoParagraph';
import { Link } from 'react-router-dom';
import { IGuardianInfo, IGuardianList, IVaultInfo } from '../@types/types';
import { BsBoxArrowUpRight, BsChevronDown, BsPen, BsPenFill } from 'react-icons/bs';

export default function ManageVaults() {
  const {
    allVaults,
    resetVaultAndSteps,
    handleConnect,
    walletAddress,
    recovery,
    web3,
    setCurrentVaultEdits,
    currentVaultEdits,
    selectedVault,
    setAllVaults,
  } = useContext(GlobalContext);
  const [importVault, setImportVault] = useState('');
  const [importIsValid, setImportIsValid] = useState('');

  useEffect(() => {
    setCurrentVaultEdits(INITIAL_VAULT_EDITS);
  }, []);

  const selectedClasses = (vault: IVaultInfo) =>
    `${currentVaultEdits.vaultAddress === vault.vaultAddress ? 'border-blue-800' : ''} group-hover:border-blue-800 `;

  const getLastUpdated = () => {
    const lastUpdated = new Date(currentVaultEdits.lastUpdated);
    return `${lastUpdated.getMonth()}-${lastUpdated.getDate()}-${lastUpdated.getFullYear()}`;
  };

  const links = (vault: IVaultInfo) => (
    <>
      {' '}
      <Link
        id={'edit_vault_' + vault.vaultAddress}
        onClick={() => {
          resetVaultAndSteps(vault);
          selectedVault.current = vault;
        }}
        to="/app/update"
        className="text-xs btnSecondary py-1 px-2"
      >
        Update
      </Link>
      <Link
        onClick={(e) => {
          resetVaultAndSteps(vault);
          selectedVault.current = vault;
        }}
        to="/app/recover"
        className="text-xs btnSecondary flex items-center mx-2 py-1 px-2"
      >
        Recover
      </Link>
      <Link
        onClick={() => {
          resetVaultAndSteps(vault);
          selectedVault.current = vault;
        }}
        to="/app/vote"
        className="text-xs btnPrimary flex items-center mr-2 py-1 px-2"
      >
        Vote
      </Link>
    </>
  );

  useEffect(() => {
    if (importVault && web3) {
      const isAddress = web3.utils.isAddress(importVault);
      if (!isAddress) {
        setImportIsValid('Invalid Eth Address');
      } else {
        setImportIsValid('');
      }
    }
  }, [importVault, web3, walletAddress]);

  const importVaultByAddress = async (address: string) => {
    try {
      const account = await recovery?.getAccount(address);
      const guardians = await recovery?.getGuardians(address);
      const threshold = await recovery?.getGuardiansThreshold(address);

      const guardiansObject: IGuardianList = {};
      guardians?.forEach((address) => {
        //@ts-ignore
        guardiansObject[address] = { name: '', address };
      });

      if (threshold && account && guardians) {
        setAllVaults({
          ...allVaults,
          [address]: {
            vaultName: '',
            guardianCount: guardians.length,
            lastUpdated: Date.now(),
            timestampId: Date.now(),
            vaultAddress: address,
            vaultOwner: 'Unknown',
            guardianList: guardiansObject,
            threshold,
            ERC725Address: account,
          },
        });
      }
    } catch (error) {}
  };

  const stringOrAddress = (text: string, short: boolean) => {
    const first2 = text.slice(0, 2);
    if (first2 === '0x') {
      return [short ? getShortId(text) : text, true];
    }

    return [text, false];
  };

  return (
    <>
      <div className="m-2 lg:m-6 font-light flex flex-col overflow-x-scroll">
        <p>Your Recovery Vaults</p>
        {allVaults ? (
          <table className="w-full border-separate border-spacing-y-6 overflow-x-scroll">
            <thead className="text-left text-xs text-gray-400 table-header-group">
              <tr>
                <th>Name</th>
                <th>Guardians</th>
                <th>Approval Threshold</th>
                <th>Address</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="overflow-x-scoll">
              {Object.entries(allVaults).map(([_, vault]) => (
                <>
                  <tr
                    id="vaultRow"
                    onClick={(e) => {
                      //@ts-ignore
                      if (e.target.id !== 'edit_vault_' + vault.vaultAddress) {
                        if (currentVaultEdits.vaultAddress === vault.vaultAddress) {
                          setCurrentVaultEdits(INITIAL_VAULT_EDITS);
                        } else {
                          setCurrentVaultEdits({ ...vault, newSecret: '', guardianRemoveAmt: 0 });
                          selectedVault.current = vault;
                        }
                      }
                    }}
                    className="vaultListItem group hover:cursor-pointer "
                  >
                    <td
                      className={
                        'w-max overflow-x-scroll no-scrollbar h-full bg-gray-800 bg-opacity-5 border-l border-y rounded-l-sm group-hover:border-blue-800 group-hover:cursor-pointer ' +
                        selectedClasses(vault)
                      }
                    >
                      {vault.vaultName}
                    </td>
                    <td className={selectedClasses(vault)}>{vault.guardianCount}</td>
                    <td className={selectedClasses(vault)}>{vault.threshold}</td>
                    <td className={selectedClasses(vault) + ' border-r rounded-r-sm lg:border-0 lg:rounded-r-none'}>
                      {getShortId(vault.vaultAddress)}
                    </td>
                    <td className={'hidden lg:table-cell border-r rounded-r-sm ' + selectedClasses(vault)}>
                      <div className="flex items-center mb-6 lg:mb-0">
                        {links(vault)}
                        <BsChevronDown
                          className={`transition-transform ${
                            currentVaultEdits.vaultAddress === vault.vaultAddress ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr className={`${currentVaultEdits.vaultAddress === vault.vaultAddress ? 'visible' : 'hidden'} `}>
                    <td colSpan={5} className="p-0">
                      {/* className={`${currentVaultEdits.vaultAddress === vault.vaultAddress ? 'h-56 max-h-fit py-1' : 'h-0 overflow-hidden'} inline-flex transition-height`} */}
                      <div className="lg:inline-flex">
                        <div className="flex items-center mb-6 lg:mb-0 lg:hidden">{links(vault)}</div>
                        <div className="">
                          {[
                            ['Recovery Vault Address', vault.vaultAddress],
                            ['Profile Address', vault.ERC725Address],
                            ['Last Updated', getLastUpdated()],
                          ].map((item: string[]) => (
                            <div className="mb-6 lg:mr-6 flex justify-center">
                              <ElementWithTitle
                                title={item[0]}
                                element={
                                  stringOrAddress(item[1], true)[1] ? (
                                    <a
                                      target="_blank"
                                      href={`${blockExplorer}${item[1]}`}
                                      className="vaultInfo hover:text-blue-800 lg:px-12 w-full flex items-center justify-center"
                                    >
                                      <span className="mr-3 hidden lg:block">{stringOrAddress(item[1], true)[0]}</span>
                                      <span className="mr-3 lg:hidden">{stringOrAddress(item[1], false)[0]}</span>
                                      <BsBoxArrowUpRight />
                                    </a>
                                  ) : (
                                    <p className="vaultInfo px-12 w-full text-center">{item[1]}</p>
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                        <ElementWithTitle
                          title={`Guardian List (${vault.guardianCount})`}
                          element={
                            <>
                              <div className="border px-6 py-3 rounded-sm flex flex-col items-center justify-center">
                                {Object.entries(vault.guardianList).map(([_, guardian]) => (
                                  <div className="flex w-fit items-center justify-center my-2">
                                    <p className="mr-6">{guardian.name}</p>
                                    <a
                                      target="_blank"
                                      href={`${blockExplorer}${guardian.address}`}
                                      className="mr-6 text-sm text-gray-400 hover:text-black flex items-center"
                                    >
                                      <span className="hidden xl:block mr-3">{guardian.address}</span>
                                      <span className="block xl:hidden mr-3">{getShortId(guardian.address)}</span>
                                      <BsBoxArrowUpRight />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </>
                          }
                        />
                      </div>{' '}
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="w-full my-4 p-2 border border-red-400 rounded-sm text-center">
            <span>No Recovery Vaults in memory! Try importing a one below or </span>
            <span>
              <Link to="/app/create" className="text-blue-800 hover:underline" onClick={() => resetVaultAndSteps()}>
                create a new Recovery Vault.
              </Link>
            </span>
          </div>
        )}

        <div className="mb-6">
          <p className="font-light text-sm md:text-base">Import a Recovery Vault by it's address.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center w-full py-1 px-6 md:px-0">
          <ElementWithTitle
            title="Import Recovery Vault"
            error={importIsValid}
            element={
              <input
                type="text"
                onChange={(e) => {
                  setImportVault(e.target.value);
                }}
                value={importVault}
                className="w-full flex-grow"
              />
            }
          />
          <button
            onClick={() => {
              walletAddress ? importVaultByAddress(importVault) : handleConnect();
            }}
            className="w-full md:w-auto rounded-sm md:py-[.9rem] flex justify-center hover:bg-blue-800 hover:bg-opacity-10 items-center px-3 border mt-2 md:mt-0 border-blue-800 md:ml-2"
          >
            <span className="cursor-pointer">Import</span>
          </button>
        </div>
      </div>
      <BackOrContinueBtns skip={[2]} back="/app/welcome" backText={'Exit'} />
    </>
  );
}
