// Handle the extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id })
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] onMessage listener ejecutado con request:', request)
  console.log('[Background] sender:', sender)
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

              const userNamesData = [
                'monitoreo',
                'juan',
                'esteban',
                'maria',
                'carlos',
                'adriana'
              ];

              const lastNamesData = [
                'digital'
              ];

              const emailsData = [
                'monitoreo.digital@avianca.com'
              ];

              const phoneNumbersData = [
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
              ];

              const getDayData = (): string => {
                const day = Math.floor(Math.random() * 28) + 1;
                return day.toString();
              };

              const getYearData = (passengerType: string = 'ADT'): string => {
                const currentYear = new Date().getFullYear();
                let year: number;

                if (passengerType.includes('ADT') || passengerType.toLowerCase().includes('adulto')) {
                  // Adulto: > 18 años (entre 19 y 60 años atrás)
                  year = currentYear - Math.floor(Math.random() * (60 - 19 + 1)) - 19;
                } else if (passengerType.includes('YTH') || passengerType.toLowerCase().includes('joven')) {
                  // Joven: 12-14 años (entre 12 y 14 años atrás)
                  year = currentYear - Math.floor(Math.random() * (14 - 12 + 1)) - 12;
                } else if (passengerType.includes('CHD') || passengerType.toLowerCase().includes('niño')) {
                  // Niño: 2-11 años (entre 2 y 11 años atrás)
                  year = currentYear - Math.floor(Math.random() * (11 - 2 + 1)) - 2;
                } else if (passengerType.includes('INF') || passengerType.toLowerCase().includes('bebé')) {
                  // Bebé: <= 2 años (entre 0 y 2 años atrás)
                  year = currentYear - Math.floor(Math.random() * 2);
                } else {
                  // Por defecto adulto
                  year = currentYear - Math.floor(Math.random() * (60 - 19 + 1)) - 19;
                }

                return year.toString();
              }

              const getPassengerType = () => {
                // Buscar el .pax-name en el tab label activo (donde está el header)
                const activeTabLabel = document.querySelector('.mat-tab-label.mat-tab-label-active');
                const paxNameElement = activeTabLabel?.querySelector('.pax-name');

                if (paxNameElement) {
                  const passengerTypeText = paxNameElement.textContent || '';
                  console.log('[CONTENT-SCRIPT] Tipo de pasajero detectado:', passengerTypeText);
                  return passengerTypeText?.trim();
                }

                console.log('[CONTENT-SCRIPT] No se encontró elemento .pax-name en el tab header, usando tipo por defecto ADT');
                return 'ADT';
              };

              const getDataRandom = (data: string[] = []): string => {
                const randomIndex = Math.floor(Math.random() * data.length);
                const selectedValue = data[randomIndex];
                console.log('[CONTENT-SCRIPT] getDataRandom: datos disponibles', data.length, 'índice seleccionado:', randomIndex, 'valor:', selectedValue);
                return selectedValue;
              };

              const getValueElement = (element: HTMLInputElement | HTMLButtonElement, passengerType: string = 'ADT'): string => {

                let value: string = "";
                let testId = element.dataset['testid'] || '';

                if (testId && testId.toLowerCase().includes('first-name-input')) {
                  value = getDataRandom(userNamesData);
                } else if (testId && testId.toLowerCase().includes('last-name-input')) {
                  value = getDataRandom(lastNamesData);
                } else if (testId && testId.toLowerCase().includes('phone-input')) {
                  value = getDataRandom(phoneNumbersData);
                } else if (testId && testId.toLowerCase().includes('email-input-element')) {
                  value = getDataRandom(emailsData);
                } else if (testId && testId.toLowerCase().includes('confirm-email-input-element')) {
                  value = getDataRandom(emailsData);
                } else if (element.name === "bday-day") {
                  value = getDayData();
                } else if (element.name === "bday-year") {
                  value = getYearData(passengerType);
                }

                console.log('[CONTENT-SCRIPT] getValueElement devolviendo valor:', value, 'para elemento:', element);
                return value;
              };

              const selectOptionElement = async (element: HTMLElement): Promise<void> => {
                console.log('[CONTENT-SCRIPT] selectOptionElement iniciado');
                (element as HTMLElement).click();

                await new Promise((r) => setTimeout(r, 200));

                // Buscar la primera opción disponible en todo el documento
                const optionSelect = document.querySelector("mat-option") as HTMLButtonElement;
                if (optionSelect) {
                  console.log('[CONTENT-SCRIPT] Clickeando primera opción:', optionSelect);
                  optionSelect.click();
                } else {
                  console.error('[CONTENT-SCRIPT] No se encontró ninguna mat-option en el documento:', element);
                }

                await new Promise((r) => setTimeout(r, 200));
              };

              const isReleaseUATEnvironment = (): boolean => {
                const url = window.location.href.toLowerCase();
                const isRelease = url.includes('release-booking');
                console.log('[CONTENT-SCRIPT] isReleaseUATEnvironment: URL actual:', url, 'isRelease:', isRelease);
                return isRelease;
              }

              const setValuesDefaultAutoForm = async (): Promise<void> => {

                const inputsElements = document.querySelectorAll(".mat-mdc-input-element") as NodeListOf<HTMLInputElement>;
                const selectElements = document.querySelectorAll('mat-select');
                const passengerType = getPassengerType();

                console.log('[CONTENT-SCRIPT] Elementos encontrados: ', inputsElements.length, inputsElements);
                console.log('[CONTENT-SCRIPT] Selects encontrados: ', selectElements.length, selectElements);
                console.log('[CONTENT-SCRIPT] Tipo de pasajero para este formulario:', passengerType);

                // recorriendo los elementos de tipo input
                for (const element of Array.from(inputsElements)) {
                  // manejando los elementos que son input pero funcionan como select
                  if (element.getAttribute("formcontrolname") === "countryPhoneExtension" ||
                    (element.dataset['test'] && element.dataset['test'].toLowerCase().includes('ta-tp-nationality'))) {

                    console.log('[CONTENT-SCRIPT] Elemento de extensión de teléfono encontrado, seleccionando opción:', element);
                    (element as HTMLInputElement).click();
                    await new Promise((r) => setTimeout(r, 200));

                    const optionSelect = document.querySelector("mat-option") as HTMLButtonElement;
                    if (optionSelect) {
                      console.log('[CONTENT-SCRIPT] Clickeando opción de extensión de teléfono:', optionSelect);
                      optionSelect.click();
                      await new Promise((r) => setTimeout(r, 200));
                    } else {
                      console.error('[CONTENT-SCRIPT] No se encontró ninguna mat-option para extensión de teléfono en el documento:', element);
                    }
                    continue;
                  }

                  const containerElement = element.closest('.mat-mdc-text-field-wrapper');
                  console.log('[CONTENT-SCRIPT] setValuesDefaultAutoForm iniciado');
                  containerElement?.classList.add('mdc-text-field--focused')

                  const eventBlur = new Event('blur');
                  const eventFocus = new Event('focus');
                  const valueElement = getValueElement(element as HTMLInputElement, passengerType);
                  (element as HTMLInputElement).value = valueElement;
                  console.log('[CONTENT-SCRIPT] Valor asignado al elemento:', valueElement);

                  ['change', 'input'].forEach((event) => {
                    console.log('[CONTENT-SCRIPT] Disparando evento:', event);
                    const handleEvent = new Event(event, { bubbles: true, cancelable: false });
                    element.dispatchEvent(handleEvent);
                  });

                  console.log('[CONTENT-SCRIPT] Disparando evento focus');
                  element.dispatchEvent(eventFocus);

                  // Esperando a que el evento blur se complete
                  await new Promise<void>((resolve) => {
                    setTimeout(() => {
                      console.log('[CONTENT-SCRIPT] Disparando evento blur');
                      element.dispatchEvent(eventBlur);
                      containerElement?.classList.remove('mdc-text-field--focused');
                      resolve();
                    }, 100);
                  });
                }

                // recorriendo los elementos de tipo select
                for (const element of Array.from(selectElements)) {
                  await selectOptionElement(element as HTMLElement);
                }

                // check input de términos y condiciones
                const checkPrivacyElement = document.querySelector('mat-checkbox[formcontrolname="isPrivacyPolicyAccepted"]') as HTMLInputElement;
                if (checkPrivacyElement) {
                  const checkInput = checkPrivacyElement.querySelector('.mdc-checkbox__native-control') as HTMLInputElement;
                  console.log('[CONTENT-SCRIPT] Elemento de política de privacidad encontrado, seleccionando:', checkPrivacyElement);
                  checkInput.click();
                } else {
                  console.error('[CONTENT-SCRIPT] No se encontró el elemento de política de privacidad en el documento');
                }
                console.log('[CONTENT-SCRIPT] setValuesDefaultAutoForm completado');
              };

              const isRealeaseUAT = isReleaseUATEnvironment();

              if (!isRealeaseUAT) {

                //lógica que sirve para amadeus producción y sprint UAT

                const numberPassengers = document.querySelector(".mat-tab-labels")?.children?.length;
                console.log('[CONTENT-SCRIPT] Número de pasajeros detectados:', numberPassengers);

                if (!numberPassengers) {
                  console.error('[CONTENT-SCRIPT] No se detectaron pasajeros en el formulario');
                  return { success: false, message: 'No se detectaron pasajeros en el formulario' };
                }

                for (let i = 0; i < numberPassengers; i++) {
                  const tabPassenger = document.querySelector(`.mat-tab-labels .mat-tab-label:nth-child(${i + 1})`) as HTMLElement;
                  tabPassenger.click();

                  // Esperar a que los elementos se carguen antes de rellenar
                  await new Promise((resolve) => {
                    setTimeout(async () => {
                      await setValuesDefaultAutoForm();
                      resolve(null);
                    }, 500);
                  });
                }

                return { success: true, message: 'Formulario rellenado', environment: 'Amadeus Prod/Sprint UAT' };
              }
              else {

                console.log('[CONTENT-SCRIPT] Entorno Release UAT detectado, ejecutando script para ambiente de release UAT');
                //lógica específica para release UAT, donde solo hay un formulario para el primer pasajero
                const accordionsPassenger = document.querySelectorAll('mat-expansion-panel') as NodeListOf<HTMLButtonElement>;
                if (accordionsPassenger.length === 0) {
                  console.error('[CONTENT-SCRIPT] No se encontraron acordeones de pasajeros en el formulario');
                  return { success: false, message: 'No se encontraron acordeones de pasajeros en el formulario' };
                }

                //abriendo los acordeones para que los campos sean detectados por el script de llenado
                for (const accordion of Array.from(accordionsPassenger)) {
                  let index = Array.from(accordionsPassenger).indexOf(accordion) + 1;
                  if (index === 1) continue;
                  accordion.click();
                  //esperando 1 segundo
                  await new Promise((r) => setTimeout(r, 200));
                }

                // llenando los elementos del formulario
                await new Promise((resolve) => {
                  setTimeout(async () => {
                    await setValuesDefaultAutoForm();
                    resolve(null);
                  }, 500);
                });

                return { success: true, message: 'Formulario rellenado Release UAT', environment: 'Amadeus Release UAT' };
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
