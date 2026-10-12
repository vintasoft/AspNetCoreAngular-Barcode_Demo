/**
 * Response from web service. Contains an URL to an image file, which is stored on server.
 */
export class FileUploadResponseParams {

  uploadedImage: string | null;


  constructor() {
    this.uploadedImage = null;
  }

}
