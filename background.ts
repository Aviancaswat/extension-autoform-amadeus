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
            func: () => {
              const userNamesData = ['monitoreo']
              const lastNamesData = ['digital']
              const emailsData = ['monitoreo.digital@avianca.com']
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
              ]

              const getDataRandom = (data: string[] = []): string => {
                const randomIndex = Math.floor(Math.random() * data.length);
                return data[randomIndex];
              };

              const getValueElement = (element: HTMLInputElement | HTMLButtonElement): string => {
                let value = '';
                if (element.name === 'email' || element.name === 'confirmEmail' || element.id.includes('email') || element.id.includes('confirmEmail')) {
                  value = getDataRandom(emailsData);
                } else if (element.name === 'phone_phoneNumberId' || element.id.includes('phone_phoneNumberId')) {
                  value = getDataRandom(phoneNumbersData);
                } else if (element.id.includes('IdFirstName')) {
                  value = getDataRandom(userNamesData);
                } else {
                  value = getDataRandom(lastNamesData);
                }
                return value;
              };

              const getButtonAndClickItem = (): void => {
                const listOptions = document.querySelector('.ui-dropdown_list');
                const buttonElement = listOptions?.querySelector('.ui-dropdown_item>button') as HTMLButtonElement;
                if (buttonElement) {
                  buttonElement.click();
                }
              };

              const setValuesDefaultAutoForm = (): void => {
                const elements = document.querySelectorAll('.ui-input');
                Array.from(elements).forEach((element) => {
                  if (element.tagName === 'BUTTON') {
                    if ((element as any).id === 'passengerId') {
                      (element as HTMLButtonElement).click();
                      setTimeout(() => {
                        getButtonAndClickItem();
                      }, 1000);
                    } else if ((element as any).id === 'phone_prefixPhoneId') {
                      setTimeout(() => {
                        (element as HTMLButtonElement).click();
                        getButtonAndClickItem();
                      }, 1000);
                    } else {
                      (element as HTMLButtonElement).click();
                      getButtonAndClickItem();
                    }
                  } else if (element.tagName === 'INPUT') {
                    const containers = document.querySelectorAll('.ui-input-container');
                    Array.from(containers).forEach((e) => {
                      e.classList.add('is-focused');
                    });
                    const eventBlur = new Event('blur');
                    const eventFocus = new Event('focus');
                    (element as HTMLInputElement).value = getValueElement(element as HTMLInputElement);
                    ['change', 'input'].forEach((event) => {
                      const handleEvent = new Event(event, { bubbles: true, cancelable: false });
                      element.dispatchEvent(handleEvent);
                    });
                    element.dispatchEvent(eventFocus);
                    setTimeout(() => {
                      element.dispatchEvent(eventBlur);
                      Array.from(containers).forEach((e) => {
                        e.classList.remove('is-focused');
                      });
                    }, 100);
                  }
                });
                const fieldAuthoritation = document.querySelector('#acceptNewCheckbox') as HTMLInputElement;
                if (fieldAuthoritation) {
                  fieldAuthoritation.checked = true;
                }
              };

              setValuesDefaultAutoForm();
              return { success: true, message: 'Formulario rellenado' };
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
