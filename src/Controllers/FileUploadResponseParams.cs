using Vintasoft.Shared.Web;

namespace AspNetCoreAngularBarcodeDemo.Controllers
{
    /// <summary>
    /// Response from web controller.
    /// Contains information about the uploaded image file.
    /// </summary>
    public class FileUploadResponseParams : WebImageInfoResponseParams
    {

        /// <summary>
        /// Initializes a new instance of the <see cref="FileUploadResponseParams"/> class.
        /// </summary>
        public FileUploadResponseParams()
        {
        }



        string _uploadedImage;
        /// <summary>
        /// Gets or sets an uploaded image as a Base64 string.
        /// </summary>
        public string uploadedImage
        {
            get { return _uploadedImage; }
            set { _uploadedImage = value; }
        }

    }
}
