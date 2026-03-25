module Api
  module V1
    class WorksController < BaseController
      before_action :set_work, only: [:show, :update, :destroy]

      def index
        @works = Work.includes(:members, :off_works)
        render json: @works, include: [:members, :off_works]
      end

      def show
        render json: @work, include: [:members, :off_works]
      end

      def create
        @work = Work.new(work_params)
        @work.save!
        render json: @work, status: :created
      end

      def update
        @work.update!(work_params)
        render json: @work
      end

      def destroy
        @work.destroy!
        head :no_content
      end

      def shuffle
        # シャッフルロジック
        work = Work.find(params[:work_id])
        members = work.available_members.active
        
        if members.empty?
          return render_error("No available members for shuffling", :unprocessable_entity)
        end

        selected_member = members.sample
        today = Date.today

        History.create!(
          work_id: work.id,
          member_id: selected_member.id,
          date: today
        )

        render json: { success: true, member: selected_member }
      end

      def bulk_update
        Work.transaction do
          params[:works].each do |work_data|
            work = Work.find(work_data[:id])
            work.update!(work_data.except(:id))
          end
        end
        render json: { success: true }
      end

      private

      def set_work
        @work = Work.find(params[:id])
      end

      def work_params
        params.require(:work).permit(:name, :multiple, :archive, :is_above)
      end
    end
  end
end
