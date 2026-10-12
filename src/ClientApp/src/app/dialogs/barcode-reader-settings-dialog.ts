import { Component, EventEmitter } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'barcode-reader-settings-dialog-content',
  templateUrl: './barcode-reader-settings-dialog.html'
})
export class BarcodeReaderSettingsDialogContent {

  // barcode reader settings
  public barcodeReaderSettings: Vintasoft.Barcode.WebBarcodeReaderSettingsJS | null;

  public event: EventEmitter<any> = new EventEmitter();

  // WebPropertyGridJS object for barcode reader settings
  private _barcodeReaderControl: PropertyGridControlJS | null;


  constructor(public activeModal: NgbActiveModal) {
    this.barcodeReaderSettings = null;
    this._barcodeReaderControl = null;
  }


  /**
   * OnInit event occurs.
   */
  ngOnInit() {
    if (this.barcodeReaderSettings == null)
      return;
    // create WebPropertyGridJS object for _barcodeReaderControl
    let propertyGrid = new Vintasoft.Shared.WebPropertyGridJS(this.barcodeReaderSettings);
    // create PropertyGridControlJS
    this._barcodeReaderControl = new PropertyGridControlJS(propertyGrid, "barcodeReaderSettingPropertyGrid", { hideNestedElements: false, showReadOnlyElements: false });
    this._barcodeReaderControl.createMarkup();
  }

  closeDialog() {
    this.event.emit({ barcodeReaderSettings: this.barcodeReaderSettings });
    this.activeModal.close();
  }

}


@Component({
  selector: 'barcode-reader-settings-dialog',
  templateUrl: './barcode-reader-settings-dialog.html'
})
export class BarcodeReaderSettingsDialog {

  public event: EventEmitter<any> = new EventEmitter();
  private _modalReference: NgbModalRef | null;


  constructor(private modalService: NgbModal, private barcodeReaderSettings: Vintasoft.Barcode.WebBarcodeReaderSettingsJS) {
    this._modalReference = null;
  }


  open() {
    this._modalReference = this.modalService.open(BarcodeReaderSettingsDialogContent, { windowClass: "custom-modal-class" });
    this._modalReference.componentInstance.barcodeReaderSettings = this.barcodeReaderSettings;
    this._modalReference.componentInstance.event.subscribe((receivedEntry: any) => {
      this.event.emit({ barcodeReaderSettings: receivedEntry.barcodeReaderSettings });
    });
  }

  public closeDialog() {
    if (this._modalReference == null)
      return;
    this._modalReference.componentInstance.closeDialog();
  }

}
