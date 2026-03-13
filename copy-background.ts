// Handle the extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id })
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] onMessage listener ejecutado con request:', request)
  console.log('[Background] sender:', sender)
  
  // Capturar logs del script inyectado
  if (request.action === 'log') {
    console.log('[INJECTED-SCRIPT]', request.message, request.data || '');
    return;
  }
  
  if (request.action === 'fillForm') {
    console.log('[Background] Acción detectada: fillForm')

    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      console.log('[Background] Pestaña activa encontrada:', tabs[0]?.id, tabs[0]?.url)
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'setDefaultFormValues'
        }, { frameId: 0 }).then((response) => {
          console.log('[Background] Mensaje enviado al content script exitosamente. Respuesta:', response)
          sendResponse({ success: true, method: 'contentScript', response })
        }).catch((error) => {
          console.error('[Background] Error enviando mensaje al content script:', error.message)
          console.error('[Background] Content script no disponible, inyectando script directamente...')

          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: async () => {
              // Helper para enviar logs al background
              const sendLogToBackground = (message: string, data?: any) => {
                chrome.runtime.sendMessage({
                  action: 'log',
                  message: message,
                  data: data
                }).catch(() => {}); // Ignorar errores si el background no está disponible
              };

              const dataForm = {
                getUserNames: () => [
                  'monitoreo',
                  'Valeria',
                  'Santiago',
                  'Camila',
                  'Sofía'
                ],
                getLastNames: () => [
                  'digital'
                ],
                getEmails: () => [
                  'monitoreo.digital@avianca.com'
                ],
                getPhoneNumbers: () => [
                  '123456',
                  '987654',
                  '654321',
                  '321654',
                  '987123',
                  '456789',
                  '102938',
                  '112233',
                  '778899',
                  '334455'
                ]
              }

              const utils = {
                getDayData: (): string => {
                  const day = Math.floor(Math.random() * 28) + 1;
                  return day.toString();
                },
                getYearData: (passengerType = 'ADT'): string => {
                  const currentYear = new Date().getFullYear();
                  let year: number;
                  if (passengerType.includes('ADT') ||
                    passengerType.toLowerCase().includes('adulto') ||
                    passengerType.toLowerCase().includes('adult')
                  ) {
                    // Adulto: > 18 años (entre 19 y 60 años atrás)
                    year = currentYear - Math.floor(Math.random() * (60 - 19 + 1)) - 19;
                  } else if (passengerType.includes('YTH') ||
                    passengerType.toLowerCase().includes('joven') ||
                    passengerType.toLowerCase().includes('youth') ||
                    passengerType.toLowerCase().includes('jovem')
                  ) {
                    // Joven: 12-14 años (entre 12 y 14 años atrás)
                    year = currentYear - Math.floor(Math.random() * (14 - 12 + 1)) - 12;
                  } else if (passengerType.includes('CHD') ||
                    passengerType.toLowerCase().includes('niño') ||
                    passengerType.toLowerCase().includes('child') ||
                    passengerType.toLowerCase().includes('criança')
                  ) {
                    // Niño: 2-11 años (entre 2 y 11 años atrás)
                    year = currentYear - Math.floor(Math.random() * (11 - 2 + 1)) - 2;
                  } else if (passengerType.includes('INF') ||
                    passengerType.toLowerCase().includes('bebé') ||
                    passengerType.toLowerCase().includes('infant') ||
                    passengerType.toLowerCase().includes('bebê')
                  ) {
                    // Bebé: <= 2 años (entre 0 y 2 años atrás)
                    year = currentYear - Math.floor(Math.random() * 2);
                  } else {
                    // Por defecto adulto
                    year = currentYear - Math.floor(Math.random() * (60 - 19 + 1)) - 19;
                  }
                  return year.toString();
                },
                getDataRandom: (data: string[] = []): string => {
                  const randomIndex = Math.floor(Math.random() * data.length);
                  const selectedValue = data[randomIndex];
                  return selectedValue;
                },
                isReleaseUATEnvironment: (): boolean => {
                  const url = window.location.href.toLowerCase();
                  const isRelease = url.includes('release-booking');
                  sendLogToBackground('[CONTENT-SCRIPT] isReleaseUATEnvironment: URL actual: ' + url + ', isRelease: ' + isRelease);
                  return isRelease;
                },
                getPassengerType: function (element?: HTMLElement): string {
                  let activeTabLabel = null;
                  let paxNameElement = null;
                  sendLogToBackground('[CONTENT-SCRIPT] getPassengerType iniciado. Element proporcionado:', element);
                  if (this.isReleaseUATEnvironment()) {
                    sendLogToBackground('[CONTENT-SCRIPT] Entorno Release UAT detectado, obteniendo tipo de pasajero para el elemento:', element);
                    if (!element) {
                      sendLogToBackground('[CONTENT-SCRIPT] ERROR: No se proporcionó el elemento para obtener el tipo de pasajero en entorno Release UAT');
                      return 'ADT';
                    }
                    const parentAccordion = element.closest('mat-expansion-panel'); //buscar el accordion activo
                    sendLogToBackground('[CONTENT-SCRIPT] parent element accordion: ', parentAccordion);
                    activeTabLabel = parentAccordion?.querySelector("mat-expansion-panel");
                    paxNameElement = activeTabLabel?.querySelector('.accordion__pax-count'); //cambiar por el de release UAT cuando esté disponible
                  } else {
                    activeTabLabel = document.querySelector('.mat-tab-label.mat-tab-label-active');
                    paxNameElement = activeTabLabel?.querySelector('.pax-name');
                  }

                  if (paxNameElement) {
                    const passengerTypeText = paxNameElement.textContent || '';
                    sendLogToBackground('[CONTENT-SCRIPT] Tipo de pasajero detectado:', passengerTypeText);
                    return passengerTypeText?.trim();
                  }

                  sendLogToBackground('[CONTENT-SCRIPT] No se encontró elemento .pax-name en el tab header, usando tipo por defecto ADT');
                  return 'ADT';
                },
                selectOptionElement: async function (element: HTMLElement): Promise<void> {
                  sendLogToBackground('[CONTENT-SCRIPT] selectOptionElement iniciado');
                  (element as HTMLElement).click();
                  await new Promise((r) => setTimeout(r, 200));
                  const optionSelect = document.querySelector("mat-option") as HTMLButtonElement;
                  if (optionSelect) {
                    sendLogToBackground('[CONTENT-SCRIPT] Clickeando primera opción:', optionSelect);
                    optionSelect.click();
                  } else {
                    sendLogToBackground('[CONTENT-SCRIPT] ERROR: No se encontró ninguna mat-option en el documento:', element);
                  }
                  await new Promise((r) => setTimeout(r, 200));
                },
                getValueElement: function (element: HTMLInputElement | HTMLButtonElement, passengerType: string = 'ADT'): string {

                  let value: string = "";
                  let testId = element.dataset['testid'] || '';

                  if (testId && testId.toLowerCase().includes('first-name-input')) {
                    value = this.getDataRandom(dataForm.getUserNames());
                  } else if (testId && testId.toLowerCase().includes('last-name-input')) {
                    value = this.getDataRandom(dataForm.getLastNames());
                  } else if (testId && testId.toLowerCase().includes('phone-input')) {
                    value = this.getDataRandom(dataForm.getPhoneNumbers());
                  } else if (testId && (testId.toLowerCase().includes('email-input-element') || testId.toLowerCase().includes('confirm-email-input-element'))) {
                    value = this.getDataRandom(dataForm.getEmails());
                  } else if (element.name === "bday-day") {
                    value = this.getDayData();
                  } else if (element.name === "bday-year") {
                    value = this.getYearData(passengerType);
                  }

                  sendLogToBackground('[CONTENT-SCRIPT] getValueElement devolviendo valor: ' + value);
                  return value;
                }
              }

              const amadeusManager = {
                isReleaseUATEnvironment: utils.isReleaseUATEnvironment(),
                setValuesFormAmadeus: async function (): Promise<void> {
                  const inputsElements = document.querySelectorAll(".mat-mdc-input-element") as NodeListOf<HTMLInputElement>;
                  const selectElements = document.querySelectorAll('mat-select');
                  // En Release UAT, se obtiene el tipo de pasajero por cada elemento
                  // En otros ambientes, se obtiene una sola vez
                  const passengerType = this.isReleaseUATEnvironment ? '' : utils.getPassengerType();

                  sendLogToBackground('[CONTENT-SCRIPT] Elementos encontrados: ' + inputsElements.length);
                  sendLogToBackground('[CONTENT-SCRIPT] Selects encontrados: ' + selectElements.length);
                  if (!this.isReleaseUATEnvironment) {
                    sendLogToBackground('[CONTENT-SCRIPT] Tipo de pasajero para este formulario: ' + passengerType);
                  }

                  // recorriendo los elementos de tipo input
                  for (const element of Array.from(inputsElements)) {
                    // Obtener el tipo de pasajero para el elemento actual
                    let currentPassengerType = passengerType;
                    if (this.isReleaseUATEnvironment) {
                      currentPassengerType = utils.getPassengerType(element);
                    }

                    // manejando los elementos que son input pero funcionan como select
                    if (element.getAttribute("formcontrolname") === "countryPhoneExtension" ||
                      (element.dataset['test'] && element.dataset['test'].toLowerCase().includes('ta-tp-nationality'))) {
                      (element as HTMLInputElement).click();
                      await new Promise((r) => setTimeout(r, 200));
                      const optionSelect = document.querySelector("mat-option") as HTMLButtonElement;
                      if (optionSelect) {
                        optionSelect.click();
                        await new Promise((r) => setTimeout(r, 200));
                      } else {
                        sendLogToBackground('[CONTENT-SCRIPT] ERROR: No se encontró ninguna mat-option para extensión de teléfono en el documento:', element);
                      }
                      continue;
                    }

                    const containerElement = element.closest('.mat-mdc-text-field-wrapper');
                    containerElement?.classList.add('mdc-text-field--focused')

                    const eventBlur = new Event('blur');
                    const eventFocus = new Event('focus');
                    const valueElement = utils.getValueElement(element as HTMLInputElement, currentPassengerType);
                    (element as HTMLInputElement).value = valueElement;

                    ['change', 'input'].forEach((event) => {
                      const handleEvent = new Event(event, { bubbles: true, cancelable: false });
                      element.dispatchEvent(handleEvent);
                    });

                    element.dispatchEvent(eventFocus);

                    // Esperando a que el evento blur se complete
                    await new Promise<void>((resolve) => {
                      setTimeout(() => {
                        element.dispatchEvent(eventBlur);
                        containerElement?.classList.remove('mdc-text-field--focused');
                        resolve();
                      }, 100);
                    });
                  }

                  // recorriendo los elementos de tipo select
                  for (const element of Array.from(selectElements)) {
                    await utils.selectOptionElement(element as HTMLElement);
                  }

                  // check input de términos y condiciones
                  const checkPrivacyElement = document.querySelector('mat-checkbox[formcontrolname="isPrivacyPolicyAccepted"]') as HTMLInputElement;
                  if (checkPrivacyElement) {
                    const checkInput = checkPrivacyElement.querySelector('.mdc-checkbox__native-control') as HTMLInputElement;
                    checkInput.click();
                  } else {
                    sendLogToBackground('[CONTENT-SCRIPT] ERROR: No se encontró el elemento de política de privacidad en el documento');
                  }
                }
              }

              const isRealeaseUAT = amadeusManager.isReleaseUATEnvironment;
              sendLogToBackground('[CONTENT-SCRIPT] isReleaseUATEnvironment: ' + isRealeaseUAT);

              if (isRealeaseUAT) {
                sendLogToBackground('[CONTENT-SCRIPT] Entorno Release UAT detectado, ejecutando script para ambiente de release UAT');
                // llenando los elementos del formulario
                await new Promise((resolve) => {
                  setTimeout(async () => {
                    await amadeusManager.setValuesFormAmadeus();
                    resolve(null);
                  }, 500);
                });

                return { success: true, message: "Formulario rellenado", enviroment: 'Amadeus Release UAT' }
              }
              else {

                const numberPassengers = document.querySelector(".mat-tab-labels")?.children?.length;
                sendLogToBackground('[CONTENT-SCRIPT] Número de pasajeros detectados: ' + numberPassengers);

                if (!numberPassengers) {
                  sendLogToBackground('[CONTENT-SCRIPT] ERROR: No se detectaron pasajeros en el formulario');
                  return { success: false, message: 'No se detectaron pasajeros en el formulario' };
                }

                for (let i = 0; i < numberPassengers; i++) {
                  const tabPassenger = document.querySelector(`.mat-tab-labels .mat-tab-label:nth-child(${i + 1})`) as HTMLElement;
                  tabPassenger.click();

                  // Esperar a que los elementos se carguen antes de rellenar
                  await new Promise((resolve) => {
                    setTimeout(async () => {
                      await amadeusManager.setValuesFormAmadeus();
                      resolve(null);
                    }, 500);
                  });
                }
                return { success: true, message: 'Formulario rellenado', environment: 'Amadeus Prod/Sprint UAT' };
              }
            }
          }).then((results) => {
            console.log('[Background] Script inyectado exitosamente. Resultados:', results)
            sendResponse({ success: true, method: 'scriptInjection', results })
          }).catch((err) => {
            console.error('[Background] Error al inyectar script:', err.message)
            sendResponse({ success: false, error: err.message, method: 'scriptInjection' })
          })
        })
      } else {
        console.error('[Background] No se encontró pestaña activa')
        sendResponse({ success: false, error: 'No active tab found' })
      }
    }).catch((err) => {
      console.error('[Background] Error al consultar pestaña activa:', err)
      sendResponse({ success: false, error: err.message })
    })

    return true
  }
})
