import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { EntryRequestComponent } from "./entry-request.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { MaterialModule } from "src/app/shared/material.module";
import { EntryDataComponent } from "../entry-data/entry-data.component";

describe("EntryRequestComponent", () => {
  let component: EntryRequestComponent;
  let fixture: ComponentFixture<EntryRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EntryRequestComponent, EntryDataComponent],
      imports: [RouterTestingModule, HttpClientTestingModule, MaterialModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});