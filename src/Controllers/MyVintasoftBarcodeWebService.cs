using System.Collections.Generic;
using System.Globalization;

using Vintasoft.Barcode;
using Vintasoft.Barcode.BarcodeInfo;
using Vintasoft.Barcode.Web.Services;
using Vintasoft.Data;
using Vintasoft.Primitives;

namespace AspNetCoreAngularBarcodeDemo.Controllers
{
    /// <summary>
    /// A platform-independent web service
    /// that handles HTTP requests from clients and allows to read and write barcodes.
    /// </summary>
    public class MyVintasoftBarcodeWebService : VintasoftBarcodeWebService
    {

        /// <summary>
        /// Initializes a new instance of the <see cref="MyVintasoftBarcodeWebService"/> class.
        /// </summary>
        /// <param name="dataStorage">Data storage that stores images.</param>
        public MyVintasoftBarcodeWebService(IDataStorage dataStorage)
            : base(dataStorage)
        {
        }



        /// <summary>
        /// Creates the barcode recognition result.
        /// </summary>
        /// <param name="info">Information about recognized barcode.</param>
        /// <param name="settings">Barcode reader settings.</param>
        /// <returns>The barcode recognition result.</returns>
        /// <remarks>
        /// This method is overridden because we want to show how to get an extended information
        /// about recognized barcode, i.e. information in <see cref="BarcodeRecognitionResult"/> class
        /// is not enough.<br />
        /// Do not override this method if information provided in <see cref="BarcodeRecognitionResult"/> class
        /// is enough for you.<br />
        /// </remarks>
        protected override WebBarcodeRecognitionResult CreateBarcodeRecognitionResult(
            IBarcodeInfo info,
            WebBarcodeReaderSettings settings)
        {
            // call the base method
            WebBarcodeRecognitionResult result = base.CreateBarcodeRecognitionResult(info, settings);

            QRInfo qrInfo = info as QRInfo;
            // if QR barcode
            if (qrInfo != null)
            {
                // get information about patterns
                VintasoftPointF leftBottomPatternCenter = qrInfo.LeftBottomFinderPatternCenter;
                VintasoftPointF leftTopPatternCenter = qrInfo.LeftTopFinderPatternCenter;
                VintasoftPointF rightTopPatternCenter = qrInfo.RightTopFinderPatternCenter;

                Dictionary<string, string> patternsInfo = new Dictionary<string, string>();
                // add information about patterns as additional
                patternsInfo.Add("LeftBottomFinderPatternCenter", PatternCenterToString(leftBottomPatternCenter));
                patternsInfo.Add("LeftTopFinderPatternCenter", PatternCenterToString(leftTopPatternCenter));
                patternsInfo.Add("RightTopFinderPatternCenter", PatternCenterToString(rightTopPatternCenter));

                result.additionalInfo = patternsInfo;
            }
            return result;
        }

        /// <summary>
        /// Converts a point to a string.
        /// </summary>
        /// <param name="p">A point.</param>
        /// <returns>A string representation of point.</returns>
        private string PatternCenterToString(VintasoftPointF p)
        {
            return string.Format("{0}x{1}", p.X.ToString("0.00", CultureInfo.InvariantCulture),
                p.Y.ToString("0.00", CultureInfo.InvariantCulture));
        }

    }
}