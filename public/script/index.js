const BASE_URL = '/api';
const UPLOAD_PATH = 'storage/signed-post';


/**
 * Uploads a file by getting a signed Spaces POST payload and using it to 
 * upload the file.
 * @param {File} file 
 * @returns 
 */
async function uploadFile(file) {
  const signedPostRes = await fetch(`${BASE_URL}/${UPLOAD_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file_name: file.name,
      content_type: file.type
    })
  })

  const signedPayload = (await signedPostRes.json()).payload;
  const form = new FormData();
  form.append('ACL', 'public-read');

  Object.entries(signedPayload.fields).forEach(([field, value]) => {
    form.append(field, value);
  })

  form.append('file', file, signedPayload.fields.key);
  await fetch(signedPayload.url, {
    method: 'POST',
    body: form,
  });

  return {
    url: signedPayload.url,
    name: signedPayload.fields.key
  };
}

async function onSubmit(event) {
  event.preventDefault();

  const file = event.target.fileInput.files[0];
  setButtonState(true);
  
  try {
    const response = await uploadFile(file);
    setAlertState({ name: response.name, url: response.url });
  } catch (error) {
    setAlertState({ error: error.message })
  } finally {
    setButtonState(false);
  }
}

function setButtonState(loading) {
  const buttonElement = document.getElementById('submitButton');
  const buttonLabelElement = document.getElementById('submitButtonLabel');
  const spinnerElement = document.getElementById('submitButtonSpinner');

  if (loading) {
    buttonElement.setAttribute('disabled', 'true');
    buttonLabelElement.textContent = 'Uploading ...'
    spinnerElement.style.display = '';
  } else {
    buttonElement.removeAttribute('disabled');
    buttonLabelElement.textContent = 'Upload';
    spinnerElement.style.display = 'none';
  }
}

const successAlertElement = document.getElementById('successAlert');
const successAlertLinkElement = document.getElementById('successAlertLink');
const errorAlertElement = document.getElementById('errorAlert');
const errorAlertMessageElement = document.getElementById('errorAlertMessage');

function closeAlerts() {
  successAlertElement.classList.add('d-none');
  successAlertLinkElement.setAttribute('href', '');
  successAlertLinkElement.textContent = '';

  errorAlertElement.classList.add('d-none');
  errorAlertMessageElement.textContent = '';
}

function setAlertState({ error, name, url}) {  
  closeAlerts();

  if (error) {
    errorAlertElement.classList.remove('d-none');
    errorAlertMessageElement.textContent = error;
  } else {
    successAlertElement.classList.remove('d-none');
    successAlertLinkElement.setAttribute('href', `${url}/${name}`);
    successAlertLinkElement.textContent = name;
  }
}