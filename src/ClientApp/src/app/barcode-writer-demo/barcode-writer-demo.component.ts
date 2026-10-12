import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BarcodeWriterSettingsDialog } from '../dialogs/barcode-writer-settings-dialog';
import { Gs1ValueEditorDialog } from "../dialogs/gs1-value-editor-dialog";

@Component({
  selector: 'app-barcode-writer-demo',
  templateUrl: './barcode-writer-demo.component.html',
})
export class BarcodeWriterDemoComponent {

  // web service (ASP.NET Core Web API controller) that allows to generate barcodes
  private _barcodeService: Vintasoft.Shared.WebServiceJS;
  // barcode writer settings
  private _barcode1DWriterSettings: Vintasoft.Barcode.Web1DBarcodeWriterSettingsJS;
  private _barcode2DWriterSettings: Vintasoft.Barcode.Web2DBarcodeWriterSettingsJS;
  private _activeBarcodeWriterSettings: Vintasoft.Barcode.WebBarcodeWriterBaseSettingsJS;
  // barcode writer
  private _barcodeWriter: Vintasoft.Barcode.WebBarcodeWriterJS;


  constructor(private modalService: NgbModal) {
    this._barcodeService = new Vintasoft.Shared.WebServiceControllerJS("vintasoft/api/MyVintasoftBarcodeApi");

    this._barcode1DWriterSettings = new Vintasoft.Barcode.Web1DBarcodeWriterSettingsJS();
    this._barcode1DWriterSettings.set_PixelFormat(new Vintasoft.Barcode.WebBarcodeImagePixelFormatEnumJS("Bgr24"));
    this._barcode2DWriterSettings = new Vintasoft.Barcode.Web2DBarcodeWriterSettingsJS();
    this._barcode2DWriterSettings.set_PixelFormat(new Vintasoft.Barcode.WebBarcodeImagePixelFormatEnumJS("Bgr24"));
    this._activeBarcodeWriterSettings = this._barcode1DWriterSettings;

    this._barcodeWriter = new Vintasoft.Barcode.WebBarcodeWriterJS(this._barcodeService);
  }


  /**
   * Sends a request to barcode service for barcode generation.
   */
  public generateBarcode() {
    this._barcodeWriter.set_Settings(this._activeBarcodeWriterSettings);

    // get barcode image as Base64 string
    this._barcodeWriter.getBarcodeAsBase64Image(this.__writeBarcode_success, this.__writeBarcode_error);
  }

  /**
   * Shows a modal dialog with barcode writer settings.
   */
  public showBarcodeWriterSettings() {
    let dlg: BarcodeWriterSettingsDialog = new BarcodeWriterSettingsDialog(this.modalService, this._barcode1DWriterSettings, this._barcode2DWriterSettings, this._activeBarcodeWriterSettings);
    dlg.open();
    dlg.event.subscribe(receivedEntry => {
      this._activeBarcodeWriterSettings = receivedEntry.barcodeWriterSettings;
    });
  }

  /**
   * Shows a dialog that allows to edit the GS1 value.
   */
  public showGs1ValueEditor() {
    let dialog = new Gs1ValueEditorDialog(this.modalService);
    dialog.barcodeService = this._barcodeService;
    dialog.open();
  }


  /**
   * Barcode is generated successfully.
   * @param data Object with information about response from barcode service.
   */
  private __writeBarcode_success(data: any) {
    var barcodeImageElement: HTMLImageElement = document.getElementById('barcodeImage') as HTMLImageElement;

    barcodeImageElement.src = data.barcodeImage;

    barcodeImageElement.onload = (event) => {
      // get real image height
      var height = barcodeImageElement.height;
      // calculate top margin
      var topMargin = 0;
      if (height < 600)
        topMargin = (600 - height) / 2;
      // set image margin
      barcodeImageElement.style.marginTop = topMargin.toString() + 'px';
    };
  }

  /**
   * Barcode generation is failed.
   * @param data Object with information about error.
   */
  private __writeBarcode_error(data: any) {
    alert(data.errorMessage);
  }

}
