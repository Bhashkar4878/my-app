import React, { useState } from 'react';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';


export default function PostComposer({ onCreate }){
const [text, setText] = useState('');
const [imageFile, setImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState(null);
const { t } = useTranslation();


async function submit(e){
e.preventDefault();
if(!text.trim()) return;
await onCreate(text.trim(), imageFile);
setText('');
setImageFile(null);
setImagePreview(null);
}


function handleFileChange(e){
const file = e.target.files?.[0];
if(!file){
setImageFile(null);
setImagePreview(null);
return;
}
setImageFile(file);
setImagePreview(URL.createObjectURL(file));
}


return (
<form className="composer" onSubmit={submit}>
<textarea value={text} onChange={e=>setText(e.target.value)} placeholder={t('composer.placeholder')} />
{imagePreview && (
<div className="composer-image-preview">
<img src={imagePreview} alt="preview" />
</div>
)}
<div className="composer-controls">
<label className="composer-upload">
📷
<input type="file" accept="image/*" onChange={handleFileChange} />
</label>
<button type="submit">{t('composer.postButton')}</button>
</div>
</form>
);
}