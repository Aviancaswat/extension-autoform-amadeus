const userNamesData = [
  'monitoreo'
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

const getDataRandom = (data: string[] = []): string => {
  const randomIndex = Math.floor(Math.random() * data.length);
  const selectedValue = data[randomIndex];
  console.log('[CONTENT-SCRIPT] getDataRandom: datos disponibles', data.length, 'índice seleccionado:', randomIndex, 'valor:', selectedValue);
  return selectedValue;
};

const getValueElement = (element: HTMLInputElement | HTMLButtonElement): string => {
  console.log('[CONTENT-SCRIPT] getValueElement llamado para elemento:', element);
  let value = '';
  if (element.name === 'email' || element.name === 'confirmEmail' || element.id.includes('email') || element.id.includes('confirmEmail')) {
    value = getDataRandom(emailsData);
    console.log('[CONTENT-SCRIPT] Asignando email:', value);
  } else if (element.name === 'phone_phoneNumberId' || element.id.includes('phone_phoneNumberId')) {
    value = getDataRandom(phoneNumbersData);
    console.log('[CONTENT-SCRIPT] Asignando phone:', value);
  } else if (element.id.includes('IdFirstName')) {
    value = getDataRandom(userNamesData);
    console.log('[CONTENT-SCRIPT] Asignando firstName:', value);
  } else {
    value = getDataRandom(lastNamesData);
    console.log('[CONTENT-SCRIPT] Asignando lastName:', value);
  }
  return value;
};

const getButtonAndClickItem = (): void => {
  console.log('[CONTENT-SCRIPT] getButtonAndClickItem iniciado');
  const listOptions = document.querySelector('.ui-dropdown_list');
  console.log('[CONTENT-SCRIPT] listOptions encontrado:', listOptions);
  const buttonElement = listOptions?.querySelector('.ui-dropdown_item>button') as HTMLButtonElement;
  console.log('[CONTENT-SCRIPT] buttonElement encontrado:', buttonElement);
  if (buttonElement) {
    console.log('[CONTENT-SCRIPT] Clickeando buttonElement');
    buttonElement.click();
  } else {
    console.error('[CONTENT-SCRIPT] No se encontró el buttonElement');
  }
};

const setValuesDefaultAutoForm = (): void => {
  console.log('[CONTENT-SCRIPT] setValuesDefaultAutoForm iniciado');
  const elements = document.querySelectorAll('.ui-input');
  console.log('[CONTENT-SCRIPT] Elementos encontrados: ', elements.length, elements);
  Array.from(elements).forEach((element, index) => {
    console.log('[CONTENT-SCRIPT] Procesando elemento', index, ':', element.tagName, (element as any).id);
    if (element.tagName === 'BUTTON') {
      if ((element as any).id === 'passengerId') {
        console.log('[CONTENT-SCRIPT] Clickeando passengerId');
        (element as HTMLButtonElement).click();
        setTimeout(() => {
          console.log('[CONTENT-SCRIPT] Llamando getButtonAndClickItem para passengerId');
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
      console.log('[CONTENT-SCRIPT] Procesando INPUT, nombre:', (element as any).name, 'id:', (element as any).id);
      const containers = document.querySelectorAll('.ui-input-container');
      console.log('[CONTENT-SCRIPT] Contenedores encontrados:', containers.length);
      Array.from(containers).forEach((e) => {
        e.classList.add('is-focused');
      });
      const eventBlur = new Event('blur');
      const eventFocus = new Event('focus');
      (element as HTMLInputElement).value = getValueElement(element as HTMLInputElement);
      console.log('[CONTENT-SCRIPT] Valor asignado al elemento:', (element as HTMLInputElement).value);
      ['change', 'input'].forEach((event) => {
        console.log('[CONTENT-SCRIPT] Disparando evento:', event);
        const handleEvent = new Event(event, { bubbles: true, cancelable: false });
        element.dispatchEvent(handleEvent);
      });
      console.log('[CONTENT-SCRIPT] Disparando evento focus');
      element.dispatchEvent(eventFocus);
      setTimeout(() => {
        console.log('[CONTENT-SCRIPT] Disparando evento blur');
        element.dispatchEvent(eventBlur);
        Array.from(containers).forEach((e) => {
          e.classList.remove('is-focused');
        });
      }, 100);
    }
  });
  const fieldAuthoritation = document.querySelector('#acceptNewCheckbox') as HTMLInputElement;
  console.log('[CONTENT-SCRIPT] Campo de autorización encontrado:', fieldAuthoritation);
  if (fieldAuthoritation) {
    console.log('[CONTENT-SCRIPT] Marcando checkbox de autorización');
    fieldAuthoritation.checked = true;
  } else {
    console.error('[CONTENT-SCRIPT] Campo de autorización NO encontrado');
  }
  console.log('[CONTENT-SCRIPT] setValuesDefaultAutoForm completado');
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[CONTENT-SCRIPT] Mensaje recibido: ', message);
  console.log('[CONTENT-SCRIPT] Origen: ', sender);
  if (message.action === 'setDefaultFormValues') {
    console.log('[CONTENT-SCRIPT] Acción detectada: setDefaultFormValues');
    try {
      setValuesDefaultAutoForm();
      console.log('[CONTENT-SCRIPT] setValuesDefaultAutoForm completado exitosamente');
      sendResponse({ status: 'success', message: 'Formulario rellenado' });
    } catch (error) {
      console.error('[CONTENT-SCRIPT] Error en setValuesDefaultAutoForm:', error);
      sendResponse({ status: 'error', message: String(error) });
    }
  } else {
    console.log('[CONTENT-SCRIPT] Acción desconocida:', message.action);
    sendResponse({ status: 'unknown' });
  }
});
