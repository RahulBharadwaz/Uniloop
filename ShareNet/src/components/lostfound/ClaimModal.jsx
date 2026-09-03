import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Modal, Input, Button } from '../ui';

export default function ClaimModal({ isOpen, onClose, post, onSubmit }) {
    const [formData, setFormData] = useState({
        message: '',
        locationFound: '',
        dateFound: '',
        proofPhotos: []
    });
    const [previews, setPreviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const isFoundPost = post?.type === 'FOUND';
    const title = isFoundPost ? 'This Is My Item' : 'I Found This Item';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData(prev => ({ ...prev, proofPhotos: [...prev.proofPhotos, ...files] }));
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setFormData(prev => ({
            ...prev,
            proofPhotos: prev.proofPhotos.filter((_, i) => i !== index)
        }));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('message', formData.message);
            if (!isFoundPost) {
                submitData.append('locationFound', formData.locationFound);
                submitData.append('dateFound', formData.dateFound);
            }
            formData.proofPhotos.forEach(photo => {
                submitData.append('proofPhotos', photo);
            });
            await onSubmit(submitData);
            onClose();
            setFormData({ message: '', locationFound: '', dateFound: '', proofPhotos: [] });
            setPreviews([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isFoundPost 
                            ? 'Explain why this item belongs to you' 
                            : 'Where and how did you find this item?'}
                    </label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={isFoundPost 
                            ? 'Describe any distinguishing features or proof of ownership...'
                            : 'Describe where you found it and any relevant details...'}
                        required
                    />
                </div>

                {!isFoundPost && (
                    <>
                        <Input
                            label="Location where you found it"
                            name="locationFound"
                            value={formData.locationFound}
                            onChange={handleChange}
                            placeholder="e.g., Central Park near the fountain"
                            required
                        />
                        <Input
                            label="Date found"
                            name="dateFound"
                            type="date"
                            value={formData.dateFound}
                            onChange={handleChange}
                            required
                        />
                    </>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proof Photos (optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative w-20 h-20">
                                <img 
                                    src={preview} 
                                    alt={`Proof ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                            <Upload size={24} className="text-gray-400" />
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" loading={isLoading} className="flex-1">
                        Submit Claim
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
