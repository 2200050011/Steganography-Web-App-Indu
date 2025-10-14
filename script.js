document.addEventListener('DOMContentLoaded', () => {
    const encodeForm = document.getElementById('encodeForm');
    const decodeForm = document.getElementById('decodeForm');
    const encodedImage = document.getElementById('encodedImage');
    const downloadLink = document.getElementById('downloadLink');
    const decodedMessageDiv = document.getElementById('decodedMessage');

    // Simple LSB Steganography Functions
    function stringToBinary(str) {
        return Array.from(str).map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
    }

    function binaryToString(binary) {
        let str = '';
        for (let i = 0; i < binary.length; i += 8) {
            let byte = binary.substr(i, 8);
            str += String.fromCharCode(parseInt(byte, 2));
        }
        return str;
    }

    function hideMessageInImage(imageData, messageBinary) {
        let data = imageData.data;
        let messageIndex = 0;
        for (let i = 0; i < data.length && messageIndex < messageBinary.length; i += 4) {  // RGBA pixels
            if (messageIndex < messageBinary.length) {
                data[i] = (data[i] & 0xFC) | parseInt(messageBinary[messageIndex]);  // LSB of red channel
                messageIndex++;
            }
        }
        return imageData;
    }

    function extractMessageFromImage(imageData, messageLength) {
        let data = imageData.data;
        let binaryMessage = '';
        for (let i = 0; i < data.length && binaryMessage.length < messageLength * 8; i += 4) {
            binaryMessage += (data[i] & 1);  // Extract LSB from red channel
        }
        return binaryMessage.slice(0, messageLength * 8);  // Trim to exact length
    }

    encodeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('imageInput').files[0];
        const message = document.getElementById('messageInput').value;
        const key = document.getElementById('encryptionKey').value;
        
        if (!file || !message) return alert('Please upload an image and enter a message.');
        
        // Encrypt the message
        const encryptedMessage = CryptoJS.AES.encrypt(message, key).toString();
        const messageBinary = stringToBinary(encryptedMessage);  // Convert to binary
        
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let modifiedImageData = hideMessageInImage(imageData, messageBinary + '1111111111111111');  // Append end marker for extraction
            
            ctx.putImageData(modifiedImageData, 0, 0);
            encodedImage.src = canvas.toDataURL('image/png');
            downloadLink.href = encodedImage.src;
            encodedImageContainer.style.display = 'block';  // Show the image
        };
    });

    decodeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('encodedImageInput').files[0];
        const key = document.getElementById('decryptionKey').value;
        
        if (!file) return alert('Please upload an encoded image.');
        
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let binaryMessage = extractMessageFromImage(imageData, 1000);  // Assume max length for simplicity
            let extractedMessage = binaryToString(binaryMessage);
            
            // Decrypt the message
            try {
                const bytes = CryptoJS.AES.decrypt(extractedMessage, key);
                const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
                decodedMessageDiv.textContent = 'Decoded Message: ' + decryptedMessage;
            } catch (error) {
                decodedMessageDiv.textContent = 'Decryption failed: Wrong key or corrupted data.';
            }
        };
    });
});
