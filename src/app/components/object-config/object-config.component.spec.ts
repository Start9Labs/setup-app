import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { ObjectConfigComponent } from './object-config.component'

describe('ObjectConfigComponent', () => {
  let component: ObjectConfigComponent
  let fixture: ComponentFixture<ObjectConfigComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObjectConfigComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectConfigComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
