import React, { Component } from 'react';
import ReactRRuleGenerator, { translations } from 'react-rrule-generator';
import { rrulestr } from 'rrule'

class App extends Component {
    previewCount = 5;
    initRule = 'DTSTART:20190301T230000Z\nFREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1';
    rrulePreview = (rruleStr) => {
        return rrulestr(rruleStr).all((date, i) => {
            if (i < (this.previewCount + 1)) return true;
            return false;
        })
    }
    state = {
        rrule: this.initRule,
        language: 'en',
        rrulePreview: this.rrulePreview(this.initRule)
    };

    getTranslation = () => (this.state.language === 'de') ? translations.german : undefined;
    onRuleChange = (rrule) => {
        this.setState({ rrule: rrule, rrulePreview: this.rrulePreview(rrule) });
        console.log(this.state);
    };

    render() {
        return (
            <div class="rootContainer">
                <ReactRRuleGenerator
                    value={this.state.rrule}
                    onChange={this.onRuleChange}
                    config={{
                        repeat: ['Yearly', 'Monthly', 'Weekly', 'Daily'],
                        end: ['Never', 'On date'],
                        weekStartsOnSunday: false,
                        hideError: true,
                    }}
                    translations={this.getTranslation()}
                />
                <div>Preview</div>
                <ul class="list-group list-group-flush">
                    {this.state.rrulePreview.map((rrdate, i) => {
                        var fdate = rrdate.toString();
                        return <li class="list-group-item" key={i}>{fdate}</li>;
                    })}
                </ul>
                <button type="button" class="btn btn-primary float-right btn-dialog">Save</button>
                <button type="button" class="btn btn-secondary float-right btn-dialog">Close</button>
            </div>
        )
    };
};
export default App;