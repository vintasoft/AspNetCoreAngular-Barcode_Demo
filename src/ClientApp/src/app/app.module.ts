import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { BarcodeDemoComponent, } from './barcode-demo/barcode-demo.component';
import { BarcodeReaderDemoComponent, } from './barcode-reader-demo/barcode-reader-demo.component';
import { BarcodeWriterDemoComponent, } from './barcode-writer-demo/barcode-writer-demo.component';
import { BarcodeReaderSettingsDialog, BarcodeReaderSettingsDialogContent } from './dialogs/barcode-reader-settings-dialog';
import { BarcodeRecognitionResultDialog, BarcodeRecognitionResultDialogContent } from './dialogs/barcode-recognition-result-dialog';
import { BarcodeWriterSettingsDialog, BarcodeWriterSettingsDialogContent } from './dialogs/barcode-writer-settings-dialog';
import { ErrorMessageDialog, ErrorMessageDialogContent } from './dialogs/error-message-dialog';
import { BlockUiDialog, BlockUiDialogContent } from './dialogs/block-ui-dialog';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    BarcodeDemoComponent,
    BarcodeReaderDemoComponent,
    BarcodeWriterDemoComponent,
    BarcodeReaderSettingsDialog,
    BarcodeReaderSettingsDialogContent,
    BarcodeRecognitionResultDialog,
    BarcodeRecognitionResultDialogContent,
    BarcodeWriterSettingsDialog,
    BarcodeWriterSettingsDialogContent,
    ErrorMessageDialog,
    ErrorMessageDialogContent,
    BlockUiDialog,
    BlockUiDialogContent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: BarcodeDemoComponent, pathMatch: 'full' },
      { path: 'barcode-reader-demo', component: BarcodeReaderDemoComponent },
      { path: 'barcode-writer-demo', component: BarcodeWriterDemoComponent },
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
