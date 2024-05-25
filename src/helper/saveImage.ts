

export const saveImage = async (imageUrl: string, name: string): Promise<void> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const fileHandle: FileSystemFileHandle = await window.showSaveFilePicker({
      suggestedName: name,
    });
    const writableStream: FileSystemWritableFileStream = await fileHandle.createWritable();
    
    await writableStream.write(blob);
    await writableStream.close();
  } catch (error) {
    console.error('Error saving image:', error);
  }
};
