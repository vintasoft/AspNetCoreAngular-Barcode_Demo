import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { BarcodeReaderSettingsDialog } from '../dialogs/barcode-reader-settings-dialog';
import { BarcodeRecognitionResultHelper } from '../barcode-reader-demo/barcode-recognition-result-helper';
import { FileUploadResponseParams } from './file-upload-response-params';
import { BarcodeRecognitionResultDialog } from '../dialogs/barcode-recognition-result-dialog';
import { ErrorMessageDialog } from '../dialogs/error-message-dialog';
import { BlockUiDialog } from '../dialogs/block-ui-dialog';


var _barcodeReaderDemoComponent: BarcodeReaderDemoComponent;


@Component({
  selector: 'barcode-reader-demo',
  templateUrl: './barcode-reader-demo.component.html',
})
export class BarcodeReaderDemoComponent {

  private _sessionId: string;

  // web service (ASP.NET Core Web API controller) that allows to read barcodes
  private _barcodeService: Vintasoft.Shared.WebServiceJS;

  // an image that is loaded in this demo
  private _activeImage: Vintasoft.Shared.WebImageJS;

  // a canvas object that is used for drawing of barcode regions on image
  private _canvas: HTMLCanvasElement | null;

  // barcode reader
  private _barcodeReader: Vintasoft.Barcode.WebBarcodeReaderJS;
  // barcode reader settings
  private _barcodeReaderSettings: Vintasoft.Barcode.WebBarcodeReaderSettingsJS;

  // an array with barcode recognition results
  public _barcodeInformation: any | null;

  // text with information about recognized barcodes
  public barcodeInformationTextBoxText: string;

  // a modal dialog that blocks UI when asynchronous operation is executing
  private _blockUiDialog: BlockUiDialog | null;



  constructor(private modalService: NgbModal, private httpClient: HttpClient) {
    _barcodeReaderDemoComponent = this;

    this._sessionId = "";
    this._canvas = null;
    this._blockUiDialog = null;

    // specify web service, which should be used for barcode recognition
    this._barcodeService = new Vintasoft.Shared.WebServiceControllerJS("vintasoft/api/MyVintasoftBarcodeApi");

    this.barcodeInformationTextBoxText = 'Please do the following steps for reading barcode:\n\n1. Click the "Barcode Reader Settings" button and specify necessary settings.\n\n2. Click the "Read Barcodes" button and barcode recognition results will be shown in this text box.\n\n3. Click on highlighted barcode in image viewer and you will see an extended information about recognized barcode.';

    let imageSource: Vintasoft.Shared.WebImageSourceJS = new Vintasoft.Shared.WebImageSourceJS("AllSupportedBarcodes.png");
    this._activeImage = new Vintasoft.Shared.WebImageJS(imageSource, 0);

    this._barcodeReader = new Vintasoft.Barcode.WebBarcodeReaderJS(this._barcodeService);

    this._barcodeReaderSettings = new Vintasoft.Barcode.WebBarcodeReaderSettingsJS();
    let defaultBarcodeTypes = new Vintasoft.Barcode.WebBarcodeTypeEnumJS("Code39");
    defaultBarcodeTypes = defaultBarcodeTypes.add("Code128");
    defaultBarcodeTypes = defaultBarcodeTypes.add("EAN13");
    defaultBarcodeTypes = defaultBarcodeTypes.add("UPCA");
    this._barcodeReaderSettings.set_BarcodeType(defaultBarcodeTypes);

    this._barcodeReaderSettings.set_PharmacodeMaxValue(1000000000);
    this._barcodeReaderSettings.set_SearchOneBarWidePharmacode(true);
  }


  ngOnInit() {
    // get identifier of current HTTP session
    this.httpClient.get<any>('api/Session/GetSessionId').subscribe((data: any) => {
      this._sessionId = data.sessionId;

      this._canvas = document.getElementById("selectionCanvas") as HTMLCanvasElement;
    });
  }

  /**
   * Shows a modal dialog with barcode reader settings.
   */
  public showBarcodeReaderSettings() {
    let dlg: BarcodeReaderSettingsDialog = new BarcodeReaderSettingsDialog(this.modalService, this._barcodeReaderSettings);
    dlg.open();
    dlg.event.subscribe(receivedEntry => {
      this._barcodeReaderSettings = receivedEntry.barcodeReaderSettings;
    });
  }

  /**
   * Sends a request to barcode service for barcode recognition.
   */
  public sendReadBarcodeRequest() {
    if (this._activeImage != undefined) {
      // disable UI
      this.__disableUI();

      // reset information about recognized barcodes
      this._barcodeInformation = Array();

      // show a message about start of barcode recognition
      this.barcodeInformationTextBoxText = 'Recognition...';

      // clear barcode regions on image
      this.__clearBarcodeRegionsOnImage();

      // set the barcode recognition settings
      this._barcodeReader.set_Settings(this._barcodeReaderSettings);

      // block UI
      this._blockUiDialog = new BlockUiDialog(this.modalService);
      this._blockUiDialog.message = "Barcode recognition...";
      this._blockUiDialog.open();

      // send a request to recognize barcodes.
      this._barcodeReader.readBarcodes(this._activeImage, this.__readBarcodes_success, this.__readBarcodes_fail);
    }

    return false;
  }

  /**
   * Image is loaded in image control.
   */
  public imageLoaded(event: any) {
    let uploadedImageElement: HTMLImageElement = document.getElementById("uploadedImage") as HTMLImageElement;
    let canvas: HTMLCanvasElement | null = this._canvas;
    if (canvas == null)
      return;

    canvas.width = uploadedImageElement.width;
    canvas.height = uploadedImageElement.height;
    let canvasLeft: number = 0;
    if (canvas.width < 680)
      canvasLeft = (680 - canvas.width) / 2;
    canvas.style.left = canvasLeft + "px";
    let canvasTop: number = 0;
    if (canvas.height < 600)
      canvasTop = (600 - canvas.height) / 2;
    canvas.style.top = canvasTop + "px";
    uploadedImageElement.style.marginTop = canvasTop + "px";
  }

  /**
   * Mouse button is double clicked on image.
   */
  public onImageDoubleClick(event: any) {
    if (this._barcodeInformation != undefined) {
      // get mouse position on image
      let mousePositionOnCanvas: any = { x: event.offsetX, y: event.offsetY };

      // for each recognized barcode
      for (let i = 0; i < this._barcodeInformation.length; i++) {
        // get information about recognized barcode
        let barcodeInformation: any = this._barcodeInformation[i];
        // get region of recognized barcode
        let barcodeRegion: any = barcodeInformation.region;
        // if mouse is clicked in barcode region
        if (this.__isPointInQuadrangle(barcodeRegion.leftTop, barcodeRegion.rightTop, barcodeRegion.rightBottom, barcodeRegion.leftBottom, mousePositionOnCanvas)) {
          // create a modal dialog with information about recognized barcode
          let dlg: BarcodeRecognitionResultDialog = new BarcodeRecognitionResultDialog(this.modalService);
          dlg.barcodeReader = this._barcodeReader;
          dlg.barcodeRecognitionResult = barcodeInformation;
          // open the dialog
          dlg.open();
        }
      }
    }
  }

  /**
   * Uploads a file to a server.
   */
  public uploadImage(files: any) {
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('sessionId', this._sessionId);

    this.httpClient.post<FileUploadResponseParams>("vintasoft/api/MyVintasoftBarcodeApi/UploadImageFile", formData).subscribe(
      data => this.__uploadImage_success(data),
      error => this.__uploadImage_error(error)
    );

    this.__clearBarcodeRegionsOnImage();
    this._barcodeInformation = null;
    this.barcodeInformationTextBoxText = 'Please do the following steps for reading barcode:\n\n1. Click the "Barcode Reader Settings" button and specify necessary settings.\n\n2. Click the "Read Barcodes" button and barcode recognition results will be shown in this text box.\n\n3. Click on highlighted barcode in image viewer and you will see an extended information about recognized barcode.';
  }


  /**
   * File is uploaded successully.
   * @param data
   */
  private __uploadImage_success(data: any) {
    if (data.errorMessage != undefined) {
      let fileInputElement: HTMLInputElement = document.getElementById("fileInput") as HTMLInputElement;
      fileInputElement.value = '';

      alert(data.errorMessage);
    }
    else {
      let imageSource: Vintasoft.Shared.WebImageSourceJS = new Vintasoft.Shared.WebImageSourceJS(data.imageInfo.fileInfo.id);
      this._activeImage = new Vintasoft.Shared.WebImageJS(imageSource, data.imageInfo.pageIndex);

      let uploadedImage: HTMLImageElement = document.getElementById("uploadedImage") as HTMLImageElement;
      uploadedImage.src = data.uploadedImage;
    }
  }

  /**
   * File uploading is failed.
   * @param data
   */
  private __uploadImage_error(data: any) {
    let fileInputElement: HTMLInputElement = document.getElementById("fileInput") as HTMLInputElement;
    fileInputElement.value = '';

    let dlg: ErrorMessageDialog = new ErrorMessageDialog(this.modalService);
    dlg.errorData = data;
    dlg.open();
  }

  /**
   * Barcodes are recognized successfully.
   * @param data Response from web service that contains information about the barcode recognition results.
   */
  private __readBarcodes_success(data: any) {
    // get information about recognized barcodes
    _barcodeReaderDemoComponent._barcodeInformation = data.results;

    let info: string = "Recognition time: " + data.recognitionTime + " ms\n\n";
    // if no barcodes found
    if (_barcodeReaderDemoComponent._barcodeInformation.length == 0) {
      info += 'No barcodes found.\n\n You should try to change barcode recognition settings, for example decrease scan interval, add new scan direction, etc if you are sure that image contains a barcode.\n\n Please send image with barcode to support@vintasoft.com if you cannot recognize barcode - we will do the best to help you.';
    }
    // if barcodes are found
    else {
      info += 'Found ' + _barcodeReaderDemoComponent._barcodeInformation.length + ' barcodes.\n\n';
      // for each recognized barcode
      for (var i = 0; i < _barcodeReaderDemoComponent._barcodeInformation.length; i++) {
        // get the barcode recognition result
        let barcodeRecognitionResult: any = _barcodeReaderDemoComponent._barcodeInformation[i];

        // draw barcode region on image
        _barcodeReaderDemoComponent.__drawBarcodeRegionOnImage(barcodeRecognitionResult.region);

        // create a HTML markup with information about barcode recognition result
        info += '[' + (i + 1) + ':' + barcodeRecognitionResult.barcodeType + ']\n' + _barcodeReaderDemoComponent.__createMarkupWithBarcodeRecognitionResult(barcodeRecognitionResult);
      }

      _barcodeReaderDemoComponent.barcodeInformationTextBoxText = info;
    }
    _barcodeReaderDemoComponent.barcodeInformationTextBoxText = info;

    // unblock UI
    if (_barcodeReaderDemoComponent._blockUiDialog != null) {
      _barcodeReaderDemoComponent._blockUiDialog.close();
    }
    _barcodeReaderDemoComponent.__enableUI();
  }

  /**
   * Barcode recognition is failed.
   * @param data Object with information about error.
   */
  private __readBarcodes_fail(data: any) {
    // unblock UI
    if (_barcodeReaderDemoComponent._blockUiDialog != null) {
      _barcodeReaderDemoComponent._blockUiDialog.close();
    }
    _barcodeReaderDemoComponent.__enableUI();
  }

  /**
   * Clears barcode regions on image.
   */
  private __clearBarcodeRegionsOnImage() {
    let ctx: CanvasRenderingContext2D | null = null;
    if (this._canvas != null)
      ctx = this._canvas.getContext("2d");
    if (ctx != null) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }

  /**
   * Draws barcode region on image.
   * @param barcodeRegion Barcode region on image.
   */
  private __drawBarcodeRegionOnImage(barcodeRegion: any) {
    let ctx: CanvasRenderingContext2D | null = null;
    if (this._canvas != null)
      ctx = this._canvas.getContext("2d");
    if (ctx != null) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(0,233,0,0.5)";
      ctx.moveTo(barcodeRegion.rightTop.x, barcodeRegion.rightTop.y);
      ctx.lineTo(barcodeRegion.leftTop.x, barcodeRegion.leftTop.y);
      ctx.lineTo(barcodeRegion.leftBottom.x, barcodeRegion.leftBottom.y);
      ctx.lineTo(barcodeRegion.rightBottom.x, barcodeRegion.rightBottom.y);
      ctx.lineTo(barcodeRegion.rightTop.x, barcodeRegion.rightTop.y);
      ctx.fill();
    }
  }

  /**
   * Creates HTML markup with information about barcode recognition result.
   * @param barcodeRecognitionResult The barcode recognition result.
   */
  private __createMarkupWithBarcodeRecognitionResult(barcodeRecognitionResult: any): string {
    let barcodeRecognitionResultHelper: BarcodeRecognitionResultHelper = new BarcodeRecognitionResultHelper(this._barcodeReader);

    let result: string = "";

    if (barcodeRecognitionResult.barcodeType == "Mailmark CMDM Type7" || barcodeRecognitionResult.barcodeType == "Mailmark CMDM Type9" || barcodeRecognitionResult.barcodeType == "Mailmark CMDM Type29") {
      result += 'Decoded value: ' + '\n';
      result += '===\n';
      result += barcodeRecognitionResultHelper.createMarkupWithInformationAboutMailmarkCMDMBarcode(barcodeRecognitionResult, false, '\n');
      result += '===\n\n';
    }
    else if (barcodeRecognitionResult.barcodeType == "PPN") {
      result += 'Decoded value: ' + '\n';
      result += '===\n';
      result += barcodeRecognitionResultHelper.createMarkupWithInformationAboutPpnBarcode(barcodeRecognitionResult, false, '\n');
      result += '===\n\n';
    }
    else if (barcodeRecognitionResult.barcodeType == "AAMVA") {
      result += 'Decoded value: ' + '\n';
      result += '===\n';
      result += barcodeRecognitionResultHelper.createMarkupWithInformationAboutAamvaBarcode(barcodeRecognitionResult, false, '\n');
      result += '===\n\n';
    }
    else if (barcodeRecognitionResult.barcodeType == "Swiss QR Code") {
      result += 'Decoded value: ' + '\n';
      result += '===\n';
      result += barcodeRecognitionResultHelper.createMarkupWithInformationAboutSwissQrCodeBarcode(barcodeRecognitionResult, false, '\n');
      result += '===\n\n';
    }
    else if (barcodeRecognitionResult.barcodeType == "IATA BCBP Aztec" || barcodeRecognitionResult.barcodeType == "IATA BCBP DataMatrix" || barcodeRecognitionResult.barcodeType == "IATA BCBP PDF417" || barcodeRecognitionResult.barcodeType == "IATA BCBP QR Code") {
      result += 'Decoded value: ' + '\n';
      result += '===\n';
      result += barcodeRecognitionResultHelper.createMarkupWithInformationAboutIataBcbpBarcode(barcodeRecognitionResult, false, '\n');
      result += '===\n\n';
    }
    else if (barcodeRecognitionResult.barcodeType.substring(0, 3) == "GS1") {
      result += 'Value: ' + barcodeRecognitionResult.value + '\n\n';
      result += 'Base value: ' + barcodeRecognitionResult.baseValue + '\n\n';
      result += 'GS1 decoded value: ' + '\n';
      result += '===\n';
      result += barcodeRecognitionResultHelper.createMarkupWithInformationAboutGS1Barcode(barcodeRecognitionResult, false, '\n') + '\n';
      result += '===\n\n';
    }
    else {
      result += 'Value: ' + barcodeRecognitionResult.value + '\n';
    }

    result += 'Confidence: ' + barcodeRecognitionResult.confidence + '\n' +
      'Reading quality: ' + barcodeRecognitionResult.readingQuality.toFixed(2) + '\n' +
      'Threshold: ' + barcodeRecognitionResult.threshold + '\n' +
      'Region: ' +
      'LT=(' + barcodeRecognitionResult.region.leftTop.x + ',' + barcodeRecognitionResult.region.leftTop.y +
      '); RT=(' + barcodeRecognitionResult.region.rightTop.x + ',' + barcodeRecognitionResult.region.rightTop.y +
      '); LB=(' + barcodeRecognitionResult.region.leftBottom.x + ',' + barcodeRecognitionResult.region.leftBottom.y +
      '); RB=(' + barcodeRecognitionResult.region.rightBottom.x + ',' + barcodeRecognitionResult.region.rightBottom.y +
      '); Angle=' + barcodeRecognitionResult.region.angle.toFixed(1) + '°\n\n';

    return result;
  }

  /**
   * Returns a value indicating whether point P belongs to a triangle ABC.
   */
  private __isPointInTriangle(a: any, b: any, c: any, p: any) {
    var ab = (p.x - b.x) * (a.y - b.y) + (p.y - b.y) * (b.x - a.x);
    var bc = (p.x - c.x) * (b.y - c.y) + (p.y - c.y) * (c.x - b.x);
    var ca = (p.x - a.x) * (c.y - a.y) + (p.y - a.y) * (a.x - c.x);
    var EPS = 0.001;
    return (ab <= EPS && bc <= EPS && ca <= EPS) || (ab > -EPS && bc > -EPS && ca > -EPS);
  }

  /**
   * Returns a value indicating whether point P belongs to a quadrangle ABCD.
   */
  private __isPointInQuadrangle(A: any, B: any, C: any, D: any, P: any) {
    return this.__isPointInTriangle(D, A, B, P) || this.__isPointInTriangle(D, C, B, P);
  }

  /**
   * Enables the UI.
   */
  private __enableUI() {
    this.__changeUIState(false);
  }

  /**
   * Disables the UI.
   */
  private __disableUI() {
    this.__changeUIState(true);
  }

  /**
   * Changes the UI state.
   */
  private __changeUIState(disable: boolean) {
    let readBarcodesElement: HTMLButtonElement = document.getElementById("ReadBarcodes") as HTMLButtonElement;
    readBarcodesElement.disabled = disable;

    let barcodeReaderSettingsElement: HTMLButtonElement = document.getElementById("BarcodeReaderSettings") as HTMLButtonElement;
    barcodeReaderSettingsElement.disabled = disable;

    let fileInputElement: HTMLInputElement = document.getElementById("fileInput") as HTMLInputElement;
    fileInputElement.disabled = disable;
  }

}
