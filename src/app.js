import React, { Component } from 'react';
import ReactRRuleGenerator, { translations } from 'react-rrule-generator';
import { rrulestr } from 'rrule'
import queryString from 'query-string';
import axios from 'axios';
import { DateTime } from 'luxon';

class App extends Component {
    previewCount = 5;
    saveLabel = (function () {
        try { return window.parent.getMessage("Save"); }
        catch (ex) { return "Save"; }
    })();
    closeLabel = (function () {
        try { return window.parent.getMessage("Close"); }
        catch (ex) { return "Close"; }
    })();
    initRule = (function () {
        let queryParms = queryString.parse(window.location.search);
        if (queryParms.rrule) return queryParms.rrule;
        return 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1';
    })();
    rrulePreview = (rruleStr) => {
        return rrulestr(rruleStr).all((date, i) => {
            if (i < (this.previewCount + 1)) return true;
            return false;
        })
    };
    state = {
        rrule: this.initRule,
        language: (function () {
            let queryParms = queryString.parse(window.location.search);
            return (queryParms.lang) ? queryParms.lang : 'en';
        })(),
        rrulePreview: this.rrulePreview(this.initRule)
    };
    getTranslation = () => (this.state.language === 'de') ? translations.german : undefined;
    onRuleChange = (rrule) => {
        this.setState({ rrule: rrule, rrulePreview: this.rrulePreview(rrule) });
        console.log(this.state);
    };
    onClickSave = () => {
        if (window.parent.g_form.isNewRecord()) {
            window.parent.g_form.setValue('rrule_str', this.state.rrule);
            window.parent.g_form.setValue("recurring", "true");
            window.parent.g_scratchpad.closeEditRecurringRuleDialog();
        } else {
            let queryParms = queryString.parse(window.location.search);
            let putData = { "recurring": "true" };
            putData[queryParms.field] = this.state.rrule;
            axios.put(`/api/now/table/${queryParms.table}/${queryParms.sys_id}`, putData, {
                headers: { "X-UserToken": window.parent.g_ck }
            }).then((response) => {
                window.parent.g_form.setValue('rrule_str', this.state.rrule);
                window.parent.g_form.setValue("recurring", "true");
                window.parent.g_scratchpad.closeEditRecurringRuleDialog();
            }).catch((ex) => {
                console.error(ex);
            });
        }
    };
    onClickCancel = () => {
        window.parent.g_scratchpad.closeEditRecurringRuleDialog();
    };

    render() {
        return (
            <div className="rootContainer">
                <ReactRRuleGenerator
                    value={this.state.rrule}
                    onChange={this.onRuleChange}
                    config={{
                        repeat: ['Yearly', 'Monthly', 'Weekly', 'Daily'],
                        end: ['Never', 'On date'],
                        weekStartsOnSunday: false,
                        hideError: true,
                        hideStart: false
                    }}
                    translations={this.getTranslation()}
                />
                <ul className="list-group list-group-flush">
                    {this.state.rrulePreview.filter((e) => {
                        var ans = true;
                        if (!window.parent || !window.parent.g_scratchpad || !window.parent.g_scratchpad.vacationDates) {
                            return true;
                        }
                        window.parent.g_scratchpad.vacationDates.forEach((vd) => {
                            if (e.toString().includes(vd.toString()))
                                ans = false;
                        });
                        return ans;
                    }).map((rrdate, i) => {
                        let locale = "en-gb";
                        if (this.language == "de") locale = "de-at";
                        let fdate = DateTime.fromJSDate(rrdate)
                            .toUTC()
                            .setZone("local", { keepLocalTime: true })
                            .toJSDate().toLocaleDateString(locale, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                            });
                        return <li className="list-group-item" key={i}>{fdate}</li>;
                    })}
                </ul>
                <button onClick={this.onClickSave} type="button" className="btn btn-primary float-right btn-dialog">{this.saveLabel}</button>
                <button onClick={this.onClickCancel} type="button" className="btn btn-secondary float-right btn-dialog">{this.closeLabel}</button>
            </div>
        )
    };
};
export default App;