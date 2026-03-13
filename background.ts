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
              // función que se usa para enviar logs en la consola de la extensión
              const sendLogToBackground = (message: string, data?: any) => {
                try {
                  console.log('[LOCAL-LOG]', message, data || '');
                  chrome.runtime.sendMessage({
                    action: 'log',
                    message: message,
                    data: data
                  }).catch((error) => {
                    console.error('[SEND-LOG-ERROR]', error.message);
                  });
                } catch (e) {
                  console.error('[SEND-LOG-ERROR]', e);
                }
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
                getDayData: function (): string {
                  const day = Math.floor(Math.random() * 28) + 1;
                  return day.toString();
                },
                getYearData: function (passengerType = 'ADT'): string {
                  const currentYear = new Date().getFullYear();
                  let year: number;

                  if (passengerType.includes('ADT') ||
                    passengerType.toLowerCase().includes('adulto') ||
                    passengerType.toLowerCase().includes('adult')
                  ) {
                    // Adulto: > 18 años (entre 19 y 60 años atrás) → 1966 a 2007
                    year = currentYear - Math.floor(Math.random() * (60 - 19 + 1)) - 19;
                  } else if (passengerType.includes('YTH') ||
                    passengerType.toLowerCase().includes('joven') ||
                    passengerType.toLowerCase().includes('youth') ||
                    passengerType.toLowerCase().includes('jovem')
                  ) {
                    // Joven: 12-14 años (entre 12 y 14 años atrás) → 2012 a 2014
                    year = currentYear - Math.floor(Math.random() * (14 - 12 + 1)) - 12;
                  } else if (passengerType.includes('CHD') ||
                    passengerType.toLowerCase().includes('niño') ||
                    passengerType.toLowerCase().includes('child') ||
                    passengerType.toLowerCase().includes('criança')
                  ) {
                    // Niño: 2-11 años (entre 2 y 11 años atrás) → 2015 a 2024
                    year = currentYear - Math.floor(Math.random() * (11 - 2 + 1)) - 2;
                  } else if (passengerType.includes('INF') ||
                    passengerType.toLowerCase().includes('bebé') ||
                    passengerType.toLowerCase().includes('infant') ||
                    passengerType.toLowerCase().includes('bebê')
                  ) {
                    // Bebé: <= 2 años (entre 0 y 2 años atrás) → 2024 a 2026
                    year = currentYear - Math.floor(Math.random() * 2);
                  } else {
                    // Por defecto adulto: > 18 años (entre 19 y 60 años atrás) → 1966 a 2007
                    year = currentYear - Math.floor(Math.random() * (60 - 19 + 1)) - 19;
                  }

                  return year.toString();
                },
                getDataRandom: function (data: string[] = []): string {
                  const randomIndex = Math.floor(Math.random() * data.length);
                  const selectedValue = data[randomIndex];
                  return selectedValue;
                },
                isReleaseUATEnvironment: (): boolean => {
                  const url = window.location.href.toLowerCase();
                  const isRelease = url.includes('release-booking');
                  return isRelease;
                },
                getPassengerType: function (element?: HTMLElement): string {
                  let paxNameElement = null;

                  if (this.isReleaseUATEnvironment()) {
                    if (!element) {
                      return 'ADT';
                    }

                    paxNameElement = element.querySelector(".accordion__pax-count")

                    if (paxNameElement) {
                      const passengerTypeText = paxNameElement.textContent || '';
                      return passengerTypeText?.trim();
                    }
                  } else {
                    const activeTabLabel = document.querySelector('.mat-tab-label.mat-tab-label-active');
                    paxNameElement = activeTabLabel?.querySelector('.pax-name');

                    if (paxNameElement) {
                      const passengerTypeText = paxNameElement.textContent || '';
                      return passengerTypeText?.trim();
                    }
                  }

                  return 'ADT';
                },
                selectOptionElement: async function (element: HTMLElement): Promise<void> {
                  (element as HTMLElement).click();
                  await new Promise((r) => setTimeout(r, 200));
                  const optionSelect = document.querySelector("mat-option") as HTMLButtonElement;
                  if (optionSelect) {
                    optionSelect.click();
                  }
                  await new Promise((r) => setTimeout(r, 200));
                },
                getValueElement: function (element: HTMLInputElement | HTMLButtonElement, passengerType: string = 'ADT'): string {
                  let value: string = "";
                  let testId = element.dataset['testid'] || '';
                  let name = element.getAttribute('name') || '';
                  let formControlName = element.getAttribute('formcontrolname') || '';

                  if (name === "bday-day" || formControlName === "day") {
                    value = this.getDayData();
                  } else if (name === "bday-year" || formControlName === "year") {
                    value = this.getYearData(passengerType);
                  } else if (name === "bday-month" || formControlName === "month") {
                    value = String(Math.floor(Math.random() * 12) + 1);
                  }
                  else if (testId && testId.toLowerCase().includes('first-name-input')) {
                    value = this.getDataRandom(dataForm.getUserNames());
                  } else if (testId && testId.toLowerCase().includes('last-name-input')) {
                    value = this.getDataRandom(dataForm.getLastNames());
                  } else if (testId && testId.toLowerCase().includes('phone-input')) {
                    value = this.getDataRandom(dataForm.getPhoneNumbers());
                  } else if (testId && (testId.toLowerCase().includes('email-input-element') || testId.toLowerCase().includes('confirm-email-input-element'))) {
                    value = this.getDataRandom(dataForm.getEmails());
                  }

                  return value;
                }
              }

              const amadeusManager = {
                isReleaseUATEnvironment: utils.isReleaseUATEnvironment(),
                monthNames: {
                  '1': 'enero',
                  '2': 'febrero',
                  '3': 'marzo',
                  '4': 'abril',
                  '5': 'mayo',
                  '6': 'junio',
                  '7': 'julio',
                  '8': 'agosto',
                  '9': 'septiembre',
                  '10': 'octubre',
                  '11': 'noviembre',
                  '12': 'diciembre'
                },
                setValuesFormAmadeus: async function (accordion?: HTMLElement): Promise<void> {
                  const container = accordion || document;
                  const inputsElements = container.querySelectorAll(".mat-mdc-input-element") as NodeListOf<HTMLInputElement>;
                  const selectElements = container.querySelectorAll('mat-select');

                  const passengerType = this.isReleaseUATEnvironment && accordion
                    ? utils.getPassengerType(accordion)
                    : utils.getPassengerType();

                  for (const element of Array.from(inputsElements)) {
                    // manejando los elementos que son input pero funcionan como select
                    if (element.getAttribute("formcontrolname") === "countryPhoneExtension" ||
                      (element.dataset['test'] && element.dataset['test'].toLowerCase().includes('ta-tp-nationality'))) {
                      (element as HTMLInputElement).click();
                      await new Promise((r) => setTimeout(r, 200));
                      const optionSelect = document.querySelector("mat-option") as HTMLButtonElement;
                      if (optionSelect) {
                        optionSelect.click();
                        await new Promise((r) => setTimeout(r, 200));
                      }
                      continue;
                    }

                    const containerElement = element.closest('.mat-mdc-text-field-wrapper');
                    containerElement?.classList.add('mdc-text-field--focused')

                    const eventBlur = new Event('blur');
                    const eventFocus = new Event('focus');
                    const valueElement = utils.getValueElement(element as HTMLInputElement, passengerType);
                    (element as HTMLInputElement).value = valueElement;

                    ['change', 'input'].forEach((event) => {
                      const handleEvent = new Event(event, { bubbles: true, cancelable: false });
                      element.dispatchEvent(handleEvent);
                    });

                    element.dispatchEvent(eventFocus);

                    await new Promise<void>((resolve) => {
                      setTimeout(() => {
                        element.dispatchEvent(eventBlur);
                        containerElement?.classList.remove('mdc-text-field--focused');
                        resolve();
                      }, 100);
                    });
                  }

                  for (const element of Array.from(selectElements)) {
                    const formControlName = element.getAttribute('formcontrolname') || '';

                    if(formControlName === "year"){
                      const valueYearByTypePassenger = utils.getYearData(passengerType);
                      (element as HTMLInputElement).click();
                      await new Promise((r) => setTimeout(r, 200));
                      const optionsYear = document.querySelectorAll("mat-option");
                      const optionYearToSelect = Array.from(optionsYear).find(option => option.textContent?.trim() === valueYearByTypePassenger);
                      if (optionYearToSelect) {
                        (optionYearToSelect as HTMLButtonElement).click();
                      }
                      continue;
                    }

                    await utils.selectOptionElement(element as HTMLElement);
                  }

                  const checkPrivacyElement = container.querySelector('mat-checkbox[formcontrolname="isPrivacyPolicyAccepted"]') as HTMLInputElement;
                  if (checkPrivacyElement) {
                    const checkInput = checkPrivacyElement.querySelector('.mdc-checkbox__native-control') as HTMLInputElement;
                    checkInput.click();
                  }
                }
              }

              const isRealeaseUAT = amadeusManager.isReleaseUATEnvironment;

              if (isRealeaseUAT) {
                const accordions = document.querySelectorAll('mat-accordion mat-expansion-panel');
                const numberAccordions = accordions.length;

                if (numberAccordions === 0) {
                  return { success: false, message: 'No se detectaron pasajeros (accordions) en el formulario' };
                }

                for (let i = 0; i < numberAccordions; i++) {
                  const accordion = accordions[i] as HTMLElement;
                  const header = accordion.querySelector('.mat-expansion-panel-header') as HTMLElement;
                  if (i !== 0) {
                    header.click();
                  }
                  await new Promise((resolve) => {
                    setTimeout(async () => {
                      await amadeusManager.setValuesFormAmadeus(accordion);

                      header.click();
                      resolve(null);
                    }, 500);
                  });
                  await new Promise((resolve) => setTimeout(resolve, 300));
                }

                return { success: true, message: "Formulario rellenado", enviroment: 'Amadeus Release UAT' }
              }
              else {

                const numberPassengers = document.querySelector(".mat-tab-labels")?.children?.length;

                if (!numberPassengers) {
                  return { success: false, message: 'No se detectaron pasajeros en el formulario' };
                }

                for (let i = 0; i < numberPassengers; i++) {
                  const tabPassenger = document.querySelector(`.mat-tab-labels .mat-tab-label:nth-child(${i + 1})`) as HTMLElement;
                  tabPassenger.click();
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
