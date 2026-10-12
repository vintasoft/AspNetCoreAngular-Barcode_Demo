import { Component, EventEmitter } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'barcode-writer-settings-dialog-content',
  templateUrl: './barcode-writer-settings-dialog.html'
})
export class BarcodeWriterSettingsDialogContent {

  // barcode writer settings
  public barcode1DWriterSettings: Vintasoft.Barcode.Web1DBarcodeWriterSettingsJS | null;
  public barcode2DWriterSettings: Vintasoft.Barcode.Web2DBarcodeWriterSettingsJS | null;
  public activeBarcodeWriterSettings: Vintasoft.Barcode.WebBarcodeWriterBaseSettingsJS | null;

  public event: EventEmitter<any> = new EventEmitter();

  // WebPropertyGridJS object for barcode writer settings
  private _barcode1DSettingsControl: PropertyGridControlJS | null;
  private _barcode2DSettingsControl: PropertyGridControlJS | null;


  constructor(public activeModal: NgbActiveModal) {
    this.barcode1DWriterSettings = null;
    this.barcode2DWriterSettings = null;
    this.activeBarcodeWriterSettings = null;
    this._barcode1DSettingsControl = null;
    this._barcode2DSettingsControl = null;
  }


  // OnInit event occurs.
  ngOnInit() {
    if (this.barcode1DWriterSettings == null || this.barcode2DWriterSettings == null)
      return;

    // create WebPropertyGridJS object for _barcode1DWriterSettings
    let propertyGrid = new Vintasoft.Shared.WebPropertyGridJS(this.barcode1DWriterSettings);
    // create PropertyGridControlJS
    this._barcode1DSettingsControl = new PropertyGridControlJS(propertyGrid, "Barcode1DSettingsPropertyGrid", { hideNestedElements: false, showReadOnlyElements: false });
    this._barcode1DSettingsControl.createMarkup();

    propertyGrid = new Vintasoft.Shared.WebPropertyGridJS(this.barcode2DWriterSettings);
    this._barcode2DSettingsControl = new PropertyGridControlJS(propertyGrid, "Barcode2DSettingsPropertyGrid", { hideNestedElements: false, showReadOnlyElements: false });
    this._barcode2DSettingsControl.createMarkup();

    if (this.activeBarcodeWriterSettings == this.barcode2DWriterSettings) {
      let barcodeDimensionSelectDiv: HTMLSelectElement = document.getElementById("barcodeDimensionSelect") as HTMLSelectElement;
      barcodeDimensionSelectDiv.selectedIndex = 1;
    }

    this.__barcodeDimensionChanged();
  }

  /**
   Barcode dimension (1D or 2D) is changed.
  */
  __barcodeDimensionChanged() {
    let barcodeDimensionSelectDiv: HTMLSelectElement = document.getElementById("barcodeDimensionSelect") as HTMLSelectElement;
    let currentDimension: string = barcodeDimensionSelectDiv.value;

    let barcode1DSettingsPropertyGridElement: HTMLElement | null = document.getElementById("Barcode1DSettingsPropertyGrid");
    let barcode2DSettingsPropertyGridElement: HTMLElement | null = document.getElementById("Barcode2DSettingsPropertyGrid");
    if (barcode1DSettingsPropertyGridElement != null && barcode2DSettingsPropertyGridElement != null) {
      if (currentDimension === "1D") {
        this.activeBarcodeWriterSettings = this.barcode1DWriterSettings;
        barcode1DSettingsPropertyGridElement.style.display = "block";
        barcode2DSettingsPropertyGridElement.style.display = "none";
      }
      else {
        this.activeBarcodeWriterSettings = this.barcode2DWriterSettings;
        barcode1DSettingsPropertyGridElement.style.display = "none";
        barcode2DSettingsPropertyGridElement.style.display = "block";
      }
    }
  }

  closeDialog() {
    this.event.emit({ barcodeWriterSettings: this.activeBarcodeWriterSettings });
    this.activeModal.close();
  }

}


@Component({
  selector: 'barcode-writer-settings-dialog',
  templateUrl: './barcode-writer-settings-dialog.html'
})
export class BarcodeWriterSettingsDialog {

  public event: EventEmitter<any> = new EventEmitter();
  private _modalReference: NgbModalRef | null;


  constructor(private modalService: NgbModal,
    private barcode1DWriterSettings: Vintasoft.Barcode.Web1DBarcodeWriterSettingsJS,
    private barcode2DWriterSettings: Vintasoft.Barcode.Web2DBarcodeWriterSettingsJS,
    private activeBarcodeWriterSettings: Vintasoft.Barcode.WebBarcodeWriterBaseSettingsJS) {
    this._modalReference = null;
  }


  open() {
    this._modalReference = this.modalService.open(BarcodeWriterSettingsDialogContent);
    this._modalReference.componentInstance.barcode1DWriterSettings = this.barcode1DWriterSettings;
    this._modalReference.componentInstance.barcode2DWriterSettings = this.barcode2DWriterSettings;
    this._modalReference.componentInstance.activeBarcodeWriterSettings = this.activeBarcodeWriterSettings;
    this._modalReference.componentInstance.event.subscribe((receivedEntry: any) => {
      this.event.emit({ barcodeWriterSettings: receivedEntry.barcodeWriterSettings });
    });
  }

  __barcodeDimensionChanged() {
    if (this._modalReference == null)
      return;
    this._modalReference.componentInstance.barcodeDimensionChanged();
  }

  public closeDialog() {
    if (this._modalReference == null)
      return;
    this._modalReference.componentInstance.closeDialog();
  }

}
