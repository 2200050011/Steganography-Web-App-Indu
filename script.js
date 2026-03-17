// ENCODE
document.getElementById("encodeForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("image", document.getElementById("imageInput").files[0]);
    formData.append("message", document.getElementById("messageInput").value);
    formData.append("key", document.getElementById("encryptionKey").value);

    const res = await fetch("http://localhost:3000/encode", {
        method: "POST",
        body: formData
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    document.getElementById("encodedImage").src = url;
    document.getElementById("downloadLink").href = url;
});
// DECODE
document.getElementById("decodeForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("image", document.getElementById("encodedImageInput").files[0]);
    formData.append("key", document.getElementById("decryptionKey").value);

    const res = await fetch("http://localhost:3000/decode", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    document.getElementById("decodedMessage").innerText = data.message;
});
