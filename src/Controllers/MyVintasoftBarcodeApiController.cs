using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;

using Vintasoft.Barcode;
using Vintasoft.Barcode.AspNetCore.ApiControllers;
using Vintasoft.Barcode.Web.Services;
using Vintasoft.Data;
using Vintasoft.Imaging;
using Vintasoft.Primitives;
using Vintasoft.Shared.Web;


namespace AspNetCoreAngularBarcodeDemo.Controllers
{
    /// <summary>
    /// An ASP.NET Core Web API controller without view support that handles HTTP requests from clients and
    /// allows to read barcodes from image stored on server.
    /// </summary>
    public class MyVintasoftBarcodeApiController : VintasoftBarcodeApiController
    {

        #region Constructors

        /// <summary>
        /// Initializes a new instance of the <see cref="MyVintasoftBarcodeApiController"/> class. 
        /// </summary>
        public MyVintasoftBarcodeApiController(IWebHostEnvironment hostingEnvironment)
            : base(hostingEnvironment)
        {
        }

        #endregion



        #region Methods

        #region PUBLIC

        /// <summary>
        /// Uploads an image file to the server.
        /// </summary>
        /// <param name="sessionId">The session identifier.</param>
        /// <param name="file">A file sent with HTTP request.</param>
        /// <returns>Response from the server.</returns>
        /// <remarks>
        /// Method saves an uploaded image file into "/UploadedImageFiles/{SessionID}" directory.
        /// </remarks>
        [HttpPost]
        public FileUploadResponseParams UploadImageFile([FromForm] string sessionId, IFormFile file)
        {
            FileUploadResponseParams answer = new FileUploadResponseParams();
            VintasoftBitmap image = null;
            try
            {
                if (sessionId == null || sessionId == string.Empty)
                    throw new ArgumentException("Request does not contain session ID.");

                // if request does NOT have file
                if (file == null)
                    throw new ArgumentException("Request does not contain files.");
                // if request has file
                else
                {
                    // if file is empty
                    if (file.Length == 0)
                        throw new ArgumentException("The first uploaded file is empty.");
                }

                // read first 4 bytes from the file stream
                byte[] first4bytes = new byte[4];
                using (Stream fs = file.OpenReadStream())
                {
                    fs.Read(first4bytes, 0, 4);
                    fs.Position = 0;

                    // if uploaded file is PDF document
                    if (first4bytes[0] == (byte)'%' &&
                        first4bytes[1] == (byte)'P' &&
                        first4bytes[2] == (byte)'D' &&
                        first4bytes[3] == (byte)'F')
                    {
                        // get image resources of first PDF page as Bitmap
                        image = GetPdfImageResourcesAsBitmap(fs, 0);
                    }
                    // if uploaded file is not PDF document
                    else
                    {
                        // get image from stream
                        image = ImageCodecs.Default.Decode(fs);
                    }

                    // convert Bitmap to a Base64 string and
                    // add the Base64 string to a HTTP answer - this is necessary for image preview
                    answer.uploadedImage = ConvertBitmapToBase64(image);

                    // dispose Bitmap
                    image.Dispose();
                    image = null;

                    // create storage
                    IDataStorage storage = CreateSessionDataStorage(sessionId);

                    // get safe filename
                    string safeName = GetSafeFileName(Path.GetFileName(file.FileName));
                    string newFileId = string.Format("{0}\\{1}", sessionId, safeName);
                    int counter = 0;
                    while (storage.Contains(newFileId))
                    {
                        newFileId = string.Format("{0}\\{1}_{2}", sessionId, counter, safeName);
                        counter++;
                    }
                    // save file
                    storage.AddItem(newFileId, fs);
                    // add information about saved image file into a HTTP answer
                    WebImageInfo imageInfo = new WebImageInfo();
                    imageInfo.fileInfo.id = newFileId;
                    imageInfo.pageIndex = 0;
                    answer.imageInfo = imageInfo;
                    answer.success = true;
                }
            }
            catch (Exception e)
            {
                answer.errorMessage = GetFullExceptionMessage(e);
            }
            finally
            {
                if (image != null)
                {
                    image.Dispose();
                    image = null;
                }
            }
            return answer;
        }

        #endregion


        #region PROTECTED

        /// <summary>
        /// Creates the <see cref="VintasoftBarcodeWebService"/>
        /// that handles HTTP requests from clients and allows to read and write barcodes.
        /// </summary>
        /// <param name="sessionId">The session identifier.</param>
        /// <returns>
        /// The <see cref="VintasoftBarcodeWebService"/>
        /// that handles HTTP requests from clients and allows to read and write barcodes.
        /// </returns>
        protected override VintasoftBarcodeWebService CreateWebService(string sessionId)
        {
            IDataStorage storage = CreateSessionDataStorage(sessionId);
            return new MyVintasoftBarcodeWebService(storage);
        }

        /// <summary>
        /// Creates a data storage for current session.
        /// </summary>
        /// <param name="sessionId">The session identifier.</param>
        /// <returns>The data storage.</returns>
        protected override IDataStorage CreateSessionDataStorage(string sessionId)
        {
            string storagePath = Path.Combine(HostingEnvironment.WebRootPath, "UploadedImageFiles");
            if (!Directory.Exists(storagePath))
                Directory.CreateDirectory(storagePath);
            return new StreamDataStorage(storagePath);
        }

        #endregion


        #region PRIVATE

        /// <summary>
        /// Converts a bitmap to a Base64 string.
        /// </summary>
        private string ConvertBitmapToBase64(VintasoftBitmap bitmap)
        {
            byte[] array;
            using (MemoryStream stream = new MemoryStream())
            {
                ImageCodecs.Default.Encode(bitmap, stream, "png");
                array = stream.ToArray();
            }
            return string.Format("data:image/png; base64,{0}", Convert.ToBase64String(array));
        }


        /// <summary>
        /// Returns a bitmap that represents image-resources of PDF page.
        /// </summary>
        /// <param name="stream">Stream that contains PDF document.</param>
        /// <param name="pageIndex">Zero based page index in PDF document.</param>
        private VintasoftBitmap GetPdfImageResourcesAsBitmap(Stream stream, int pageIndex)
        {
            // if is DEMO version
            if (BarcodeGlobalSettings.IsDemoVersion == true)
            {
                if (pageIndex > 0)
                    throw new IndexOutOfRangeException("Demo version allows to work only with the first page of PDF document.");
            }

            VintasoftBitmap result = null;
            List<VintasoftBitmap> pdfImageResources = new List<VintasoftBitmap>();

            using (PdfImageViewer viewer = new PdfImageViewer(stream))
            {

                string[] names = viewer.GetImageNames(pageIndex);
                for (int i = 0; i < names.Length; i++)
                    pdfImageResources.Add(viewer.GetImage(pageIndex, names[i]));

                if (pdfImageResources.Count == 0)
                {
                    result = null;
                }
                else if (pdfImageResources.Count == 1)
                {
                    result = pdfImageResources[0];
                }
                else
                {
                    int padding = 5;
                    int heigth = 0;
                    int width = 0;
                    int n = pdfImageResources.Count;
                    for (int i = 0; i < n; i++)
                    {
                        VintasoftBitmap current = pdfImageResources[i];
                        if (width < current.Width)
                            width = current.Width;
                        heigth += current.Height;
                    }
                    width += 3;
                    heigth += (n + 1) * padding;
                    result = VintasoftBitmapFactory.Default.CreateBitmap(width, heigth, Vintasoft.Imaging.PixelFormat.Bgr24);
                    VintasoftBitmapProcessing.Clear(result, VintasoftColor.White);
                    int dy = 1;
                    for (int i = 0; i < n; i++)
                    {
                        VintasoftBitmap imageResource = pdfImageResources[i];
                        VintasoftBitmapProcessing.Overlay(result, imageResource, 1, dy);
                        dy += imageResource.Height + padding;
                        imageResource.Dispose();
                    }
                }

                // if image is not loaded
                if (result == null)
                    throw new Exception("Image is not loaded.");
            }

            return result;
        }


        /// <summary>
        /// Returns a safe filename.
        /// </summary>
        /// <param name="fileName">File name.</param>
        /// <returns>Safe file name.</returns>
        private string GetSafeFileName(string fileName)
        {
            string spacePattern = @"(\s)";
            string replace = "_";
            string nameWithoutSpace = Regex.Replace(fileName, spacePattern, replace);
            string charPattern = @"[^A-Za-z0-9_.]";
            string charReplace = "X";
            return Regex.Replace(nameWithoutSpace, charPattern, charReplace);
        }

        /// <summary>
        /// Returns a string that contains recursive information about an exception.
        /// </summary>
        /// <param name="ex">The exception.</param>
        /// <returns>A string that contains recursive information about an exception.</returns>
        private string GetFullExceptionMessage(Exception ex)
        {
            System.Text.StringBuilder sb = new System.Text.StringBuilder();
            sb.AppendLine(ex.Message);
            Exception innerException = ex.InnerException;
            while (innerException != null)
            {
                sb.AppendLine(string.Format("Inner exception: {0}", innerException.Message));
                innerException = innerException.InnerException;
            }
            return sb.ToString();
        }

        #endregion

        #endregion

    }
}